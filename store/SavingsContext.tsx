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
    ])
      .then(async ([apiWallets, apiSavingsTxs]) => {
        // --- Savings wallets ---
        if (apiWallets && apiWallets.length > 0) {
          setWallets(apiWallets);
          saveData(KEYS.SAVINGS_WALLETS, apiWallets);
        } else {
          const localWallets = await loadData<SavingsWallet[]>(KEYS.SAVINGS_WALLETS);
          if (localWallets && localWallets.length > 0) {
            // Push existing local wallets to the server
            setWallets(localWallets);
            localWallets.forEach((wallet) =>
              apiRequest("POST", "/api/savings-wallets", wallet).catch(() => {})
            );
          } else {
            // First launch — seed a default "General Savings" wallet
            const defaultWallet = createDefaultSavingsWallet();
            setWallets([defaultWallet]);
            saveData(KEYS.SAVINGS_WALLETS, [defaultWallet]);
            apiRequest("POST", "/api/savings-wallets", defaultWallet).catch(() => {});
          }
        }

        // --- Savings transactions ---
        if (apiSavingsTxs && apiSavingsTxs.length > 0) {
          setSavingsTransactions(apiSavingsTxs);
          saveData(KEYS.SAVINGS_TRANSACTIONS, apiSavingsTxs);
        } else {
          // API returned empty — push local cache to the server
          const localSavingsTxs = await loadData<SavingsTransaction[]>(KEYS.SAVINGS_TRANSACTIONS);
          if (localSavingsTxs && localSavingsTxs.length > 0) {
            setSavingsTransactions(localSavingsTxs);
            localSavingsTxs.forEach((savingsTx) =>
              apiRequest("POST", "/api/savings-transactions", savingsTx).catch(() => {})
            );
          }
        }
      })
      .catch(async () => {
        // Network unavailable — fall back to local cache, ensuring at least a default wallet
        const localWallets = await loadData<SavingsWallet[]>(KEYS.SAVINGS_WALLETS);
        setWallets(localWallets && localWallets.length > 0 ? localWallets : [createDefaultSavingsWallet()]);
        const localSavingsTxs = await loadData<SavingsTransaction[]>(KEYS.SAVINGS_TRANSACTIONS);
        setSavingsTransactions(localSavingsTxs || []);
      })
      .finally(() => setIsLoaded(true));
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

  /**
   * Records a savings transaction and immediately updates the wallet's current_amount.
   * - deposit_internal / deposit_external → adds to balance (positive delta)
   * - withdrawal / transfer_out → subtracts from balance (negative delta)
   * The wallet balance is floored at 0 to prevent negative savings balances.
   */
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
