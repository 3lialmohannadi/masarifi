import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { SavingsWallet, SavingsTransaction } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { createDefaultSavingsWallet } from "@/utils/defaults";
import { apiRequest } from "@/services/api";
import { useAuth } from "@/store/AuthContext";

const GUEST_ID = "guest";

interface SavingsContextValue {
  wallets: SavingsWallet[];
  savingsTransactions: SavingsTransaction[];
  addWallet: (w: Omit<SavingsWallet, "id" | "created_at" | "updated_at">) => SavingsWallet;
  updateWallet: (id: string, updates: Partial<SavingsWallet>) => void;
  deleteWallet: (id: string) => void;
  getWallet: (id: string) => SavingsWallet | undefined;
  addSavingsTransaction: (tx: Omit<SavingsTransaction, "id" | "created_at">) => SavingsTransaction;
  getWalletTransactions: (walletId: string) => SavingsTransaction[];
  totalSavings: number;
  clearAll: () => void;
  isLoaded: boolean;
}

const SavingsContext = createContext<SavingsContextValue | null>(null);

export function SavingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || GUEST_ID;

  const [wallets, setWallets] = useState<SavingsWallet[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWallets([]);
    setSavingsTransactions([]);
    setIsLoaded(false);
    let cancelled = false;
    const walletsKey = `${KEYS.SAVINGS_WALLETS}_${userId}`;
    const txKey = `${KEYS.SAVINGS_TRANSACTIONS}_${userId}`;

    async function hydrate() {
      const localWallets = await loadData<SavingsWallet[]>(walletsKey) || [];
      const localTxs = await loadData<SavingsTransaction[]>(txKey) || [];
      if (cancelled) return;

      if (localWallets.length > 0) {
        setWallets(localWallets);
        setSavingsTransactions(localTxs);
        setIsLoaded(true);
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const [apiWallets, apiTxs] = await Promise.all([
              apiRequest("GET", "/api/savings-wallets").then((r) => r.json()).catch(() => null),
              apiRequest("GET", "/api/savings-transactions").then((r) => r.json()).catch(() => null),
            ]);
            if (cancelled) return;
            if (Array.isArray(apiWallets) && apiWallets.length > 0) {
              setWallets(apiWallets);
              saveData(walletsKey, apiWallets);
            }
            if (Array.isArray(apiTxs) && apiTxs.length > 0) {
              setSavingsTransactions(apiTxs);
              saveData(txKey, apiTxs);
            }
          } catch { /* keep local */ }
        }, 2000);
      } else {
        try {
          const [apiWallets, apiTxs] = await Promise.all([
            apiRequest("GET", "/api/savings-wallets").then((r) => r.json()).catch(() => null),
            apiRequest("GET", "/api/savings-transactions").then((r) => r.json()).catch(() => null),
          ]);
          if (cancelled) return;
          if (Array.isArray(apiWallets) && apiWallets.length > 0) {
            setWallets(apiWallets);
            saveData(walletsKey, apiWallets);
          } else {
            const defaultWallet = createDefaultSavingsWallet();
            setWallets([defaultWallet]);
            saveData(walletsKey, [defaultWallet]);
            apiRequest("POST", "/api/savings-wallets", defaultWallet).catch(() => {});
          }
          if (Array.isArray(apiTxs) && apiTxs.length > 0) {
            setSavingsTransactions(apiTxs);
            saveData(txKey, apiTxs);
          }
        } catch {
          const defaultWallet = createDefaultSavingsWallet();
          if (!cancelled) {
            setWallets([defaultWallet]);
            saveData(walletsKey, [defaultWallet]);
          }
        }
        if (!cancelled) setIsLoaded(true);
      }
    }
    hydrate();
    return () => { cancelled = true; };
  }, [userId]);

  const walletsKey = `${KEYS.SAVINGS_WALLETS}_${userId}`;
  const txKey = `${KEYS.SAVINGS_TRANSACTIONS}_${userId}`;

  const persistWallets = (data: SavingsWallet[]) => {
    setWallets(data);
    saveData(walletsKey, data);
  };

  const persistTransactions = (data: SavingsTransaction[]) => {
    setSavingsTransactions(data);
    saveData(txKey, data);
  };

  const addWallet = (w: Omit<SavingsWallet, "id" | "created_at" | "updated_at">): SavingsWallet => {
    const newWallet: SavingsWallet = {
      ...w,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persistWallets([...wallets, newWallet]);
    apiRequest("POST", "/api/savings-wallets", newWallet).catch((e: unknown) => console.warn("[Sync]", e));
    return newWallet;
  };

  const updateWallet = (id: string, updates: Partial<SavingsWallet>) => {
    const updated = wallets.map((w) =>
      w.id === id ? { ...w, ...updates, updated_at: now() } : w
    );
    persistWallets(updated);
    const record = updated.find((w) => w.id === id);
    if (record) apiRequest("PATCH", `/api/savings-wallets/${id}`, record).catch((e: unknown) => console.warn("[Sync]", e));
  };

  const deleteWallet = (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (wallet?.is_default) return;
    persistWallets(wallets.filter((w) => w.id !== id));
    persistTransactions(savingsTransactions.filter((t) => t.wallet_id !== id));
    apiRequest("DELETE", `/api/savings-wallets/${id}`).catch((e: unknown) => console.warn("[Sync]", e));
  };

  const getWallet = (id: string) => wallets.find((w) => w.id === id);

  const addSavingsTransaction = (tx: Omit<SavingsTransaction, "id" | "created_at">): SavingsTransaction => {
    const newTx: SavingsTransaction = { ...tx, id: generateId(), created_at: now() };
    persistTransactions([...savingsTransactions, newTx]);

    const isDeposit = tx.type === "deposit_internal" || tx.type === "deposit_external";
    const delta = isDeposit ? tx.amount : -tx.amount;
    const updatedWallets = wallets.map((w) =>
      w.id === tx.wallet_id
        ? { ...w, current_amount: Math.max(0, w.current_amount + delta), updated_at: now() }
        : w
    );
    persistWallets(updatedWallets);

    apiRequest("POST", "/api/savings-transactions", newTx).catch((e: unknown) => console.warn("[Sync]", e));
    const updatedWallet = updatedWallets.find((w) => w.id === tx.wallet_id);
    if (updatedWallet) {
      apiRequest("PATCH", `/api/savings-wallets/${tx.wallet_id}`, updatedWallet).catch((e: unknown) => console.warn("[Sync]", e));
    }
    return newTx;
  };

  const getWalletTransactions = (walletId: string) =>
    savingsTransactions.filter((t) => t.wallet_id === walletId);

  const totalSavings = useMemo(
    () => wallets.filter((w) => !w.is_archived).reduce((sum, w) => sum + w.current_amount, 0),
    [wallets]
  );

  const clearAll = () => {
    persistWallets([]);
    persistTransactions([]);
  };

  const value = useMemo(
    () => ({
      wallets,
      savingsTransactions,
      addWallet,
      updateWallet,
      deleteWallet,
      getWallet,
      addSavingsTransaction,
      getWalletTransactions,
      totalSavings,
      clearAll,
      isLoaded,
    }),
    [wallets, savingsTransactions, totalSavings, isLoaded] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>;
}

export function useSavings() {
  const ctx = useContext(SavingsContext);
  if (!ctx) throw new Error("useSavings must be used within SavingsProvider");
  return ctx;
}
