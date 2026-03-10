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
import { apiRequest } from "@/lib/query-client";

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
  const [wallets, setWallets] = useState<SavingsWallet[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest("GET", "/api/savings-wallets").then((r) => r.json()).catch(() => null),
      apiRequest("GET", "/api/savings-transactions").then((r) => r.json()).catch(() => null),
    ]).then(async ([apiWallets, apiTxs]) => {
      if (apiWallets && apiWallets.length > 0) {
        setWallets(apiWallets);
        saveData(KEYS.SAVINGS_WALLETS, apiWallets);
      } else {
        const local = await loadData<SavingsWallet[]>(KEYS.SAVINGS_WALLETS);
        if (local && local.length > 0) {
          setWallets(local);
          local.forEach((item) =>
            apiRequest("POST", "/api/savings-wallets", item).catch(() => {})
          );
        } else {
          const defaultWallet = createDefaultSavingsWallet();
          setWallets([defaultWallet]);
          saveData(KEYS.SAVINGS_WALLETS, [defaultWallet]);
          apiRequest("POST", "/api/savings-wallets", defaultWallet).catch(() => {});
        }
      }

      if (apiTxs && apiTxs.length > 0) {
        setSavingsTransactions(apiTxs);
        saveData(KEYS.SAVINGS_TRANSACTIONS, apiTxs);
      } else {
        const local = await loadData<SavingsTransaction[]>(KEYS.SAVINGS_TRANSACTIONS);
        if (local && local.length > 0) {
          setSavingsTransactions(local);
          local.forEach((item) =>
            apiRequest("POST", "/api/savings-transactions", item).catch(() => {})
          );
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const persistWallets = (data: SavingsWallet[]) => {
    setWallets(data);
    saveData(KEYS.SAVINGS_WALLETS, data);
  };

  const persistTransactions = (data: SavingsTransaction[]) => {
    setSavingsTransactions(data);
    saveData(KEYS.SAVINGS_TRANSACTIONS, data);
  };

  const addWallet = (w: Omit<SavingsWallet, "id" | "created_at" | "updated_at">): SavingsWallet => {
    const newWallet: SavingsWallet = {
      ...w,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persistWallets([...wallets, newWallet]);
    apiRequest("POST", "/api/savings-wallets", newWallet).catch(console.error);
    return newWallet;
  };

  const updateWallet = (id: string, updates: Partial<SavingsWallet>) => {
    const updated = wallets.map((w) =>
      w.id === id ? { ...w, ...updates, updated_at: now() } : w
    );
    persistWallets(updated);
    const record = updated.find((w) => w.id === id);
    if (record) apiRequest("PATCH", `/api/savings-wallets/${id}`, record).catch(console.error);
  };

  const deleteWallet = (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (wallet?.is_default) return;
    persistWallets(wallets.filter((w) => w.id !== id));
    persistTransactions(savingsTransactions.filter((t) => t.wallet_id !== id));
    apiRequest("DELETE", `/api/savings-wallets/${id}`).catch(console.error);
  };

  const getWallet = (id: string) => wallets.find((w) => w.id === id);

  const addSavingsTransaction = (tx: Omit<SavingsTransaction, "id" | "created_at">): SavingsTransaction => {
    const newTx: SavingsTransaction = { ...tx, id: generateId(), created_at: now() };
    persistTransactions([...savingsTransactions, newTx]);

    const delta =
      tx.type === "deposit_internal" || tx.type === "deposit_external" ? tx.amount : -tx.amount;
    const updatedWallets = wallets.map((w) =>
      w.id === tx.wallet_id
        ? { ...w, current_amount: Math.max(0, w.current_amount + delta), updated_at: now() }
        : w
    );
    persistWallets(updatedWallets);

    apiRequest("POST", "/api/savings-transactions", newTx).catch(console.error);
    const updatedWallet = updatedWallets.find((w) => w.id === tx.wallet_id);
    if (updatedWallet) {
      apiRequest("PATCH", `/api/savings-wallets/${tx.wallet_id}`, updatedWallet).catch(console.error);
    }
    return newTx;
  };

  const getWalletTransactions = (walletId: string) =>
    savingsTransactions.filter((t) => t.wallet_id === walletId);

  const totalSavings = useMemo(
    () => wallets.reduce((sum, w) => sum + w.current_amount, 0),
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
    [wallets, savingsTransactions, totalSavings, isLoaded]
  );

  return <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>;
}

export function useSavings() {
  const ctx = useContext(SavingsContext);
  if (!ctx) throw new Error("useSavings must be used within SavingsProvider");
  return ctx;
}
