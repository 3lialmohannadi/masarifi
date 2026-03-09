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
  isLoaded: boolean;
}

const SavingsContext = createContext<SavingsContextValue | null>(null);

export function SavingsProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<SavingsWallet[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadData<SavingsWallet[]>(KEYS.SAVINGS_WALLETS),
      loadData<SavingsTransaction[]>(KEYS.SAVINGS_TRANSACTIONS),
    ]).then(([ws, ts]) => {
      if (ws && ws.length > 0) {
        setWallets(ws);
      } else {
        const defaultWallet = createDefaultSavingsWallet();
        setWallets([defaultWallet]);
        saveData(KEYS.SAVINGS_WALLETS, [defaultWallet]);
      }
      setSavingsTransactions(ts || []);
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

  const addWallet = (w: Omit<SavingsWallet, "id" | "created_at" | "updated_at">) => {
    const newWallet: SavingsWallet = {
      ...w,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persistWallets([...wallets, newWallet]);
    return newWallet;
  };

  const updateWallet = (id: string, updates: Partial<SavingsWallet>) => {
    persistWallets(
      wallets.map((w) => (w.id === id ? { ...w, ...updates, updated_at: now() } : w))
    );
  };

  const deleteWallet = (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (wallet?.is_default) return;
    persistWallets(wallets.filter((w) => w.id !== id));
    persistTransactions(savingsTransactions.filter((t) => t.wallet_id !== id));
  };

  const getWallet = (id: string) => wallets.find((w) => w.id === id);

  const addSavingsTransaction = (tx: Omit<SavingsTransaction, "id" | "created_at">) => {
    const newTx: SavingsTransaction = { ...tx, id: generateId(), created_at: now() };
    persistTransactions([...savingsTransactions, newTx]);

    const delta =
      tx.type === "deposit_internal" || tx.type === "deposit_external" ? tx.amount : -tx.amount;
    persistWallets(
      wallets.map((w) =>
        w.id === tx.wallet_id
          ? { ...w, current_amount: Math.max(0, w.current_amount + delta), updated_at: now() }
          : w
      )
    );
    return newTx;
  };

  const getWalletTransactions = (walletId: string) =>
    savingsTransactions.filter((t) => t.wallet_id === walletId);

  const totalSavings = useMemo(
    () => wallets.reduce((sum, w) => sum + w.current_amount, 0),
    [wallets]
  );

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
