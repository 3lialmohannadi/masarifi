import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { Transaction, Transfer } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { apiRequest } from "@/services/api";
import { createSyncFn } from "@/utils/syncHelper";
import { useAuth } from "@/store/AuthContext";

const GUEST_ID = "guest";

export interface DailyLimitOpts {
  enabled: boolean;
  dailyLimit: number;
}

interface TransactionsContextValue {
  transactions: Transaction[];
  transfers: Transfer[];
  addTransaction: (tx: Omit<Transaction, "id" | "created_at" | "updated_at">, dailyLimitOpts?: DailyLimitOpts) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addTransfer: (tf: Omit<Transfer, "id" | "created_at">) => Transfer;
  deleteTransfer: (id: string) => void;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  categoryIdsInUse: string[];
  clearAll: () => void;
  isLoaded: boolean;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || GUEST_ID;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const sync = createSyncFn();

  useEffect(() => {
    setTransactions([]);
    setTransfers([]);
    setIsLoaded(false);
    let cancelled = false;
    const txKey = `${KEYS.TRANSACTIONS}_${userId}`;
    const tfKey = `${KEYS.TRANSFERS}_${userId}`;

    async function hydrate() {
      const localTx = await loadData<Transaction[]>(txKey) || [];
      const localTf = await loadData<Transfer[]>(tfKey) || [];
      if (cancelled) return;

      if (localTx.length > 0 || localTf.length > 0) {
        setTransactions(localTx);
        setTransfers(localTf);
        setIsLoaded(true);
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const [apiTx, apiTf] = await Promise.all([
              apiRequest("GET", "/api/transactions").then((r) => r.json()).catch(() => null),
              apiRequest("GET", "/api/transfers").then((r) => r.json()).catch(() => null),
            ]);
            if (cancelled) return;
            if (Array.isArray(apiTx) && apiTx.length > 0) {
              setTransactions(apiTx);
              saveData(txKey, apiTx);
            }
            if (Array.isArray(apiTf) && apiTf.length > 0) {
              setTransfers(apiTf);
              saveData(tfKey, apiTf);
            }
          } catch { /* ignore */ }
        }, 2000);
      } else {
        try {
          const [apiTx, apiTf] = await Promise.all([
            apiRequest("GET", "/api/transactions").then((r) => r.json()).catch(() => null),
            apiRequest("GET", "/api/transfers").then((r) => r.json()).catch(() => null),
          ]);
          if (cancelled) return;
          if (Array.isArray(apiTx) && apiTx.length > 0) {
            setTransactions(apiTx);
            saveData(txKey, apiTx);
          }
          if (Array.isArray(apiTf) && apiTf.length > 0) {
            setTransfers(apiTf);
            saveData(tfKey, apiTf);
          }
        } catch {
          // server unavailable — start with empty state
        }
        if (!cancelled) setIsLoaded(true);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, [userId]);

  const txKey = `${KEYS.TRANSACTIONS}_${userId}`;
  const tfKey = `${KEYS.TRANSFERS}_${userId}`;

  const persistTx = (data: Transaction[]) => {
    setTransactions(data);
    saveData(txKey, data);
  };

  const persistTf = (data: Transfer[]) => {
    setTransfers(data);
    saveData(tfKey, data);
  };

  const addTransaction = (
    tx: Omit<Transaction, "id" | "created_at" | "updated_at">,
    dailyLimitOpts?: DailyLimitOpts
  ): Transaction => {
    const newTx: Transaction = {
      ...tx,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    const updatedTransactions = [...transactions, newTx];
    persistTx(updatedTransactions);
    sync(apiRequest("POST", "/api/transactions", newTx), "create transaction");

    // Trigger daily limit alert for expense transactions
    if (
      tx.type === "expense" &&
      dailyLimitOpts?.enabled &&
      dailyLimitOpts.dailyLimit > 0
    ) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaySpend = updatedTransactions
        .filter((t) => t.type === "expense" && t.date.startsWith(todayStr))
        .reduce((s, t) => s + t.amount, 0);
      import("@/utils/notifications").then(({ checkDailyLimitAlert }) => {
        checkDailyLimitAlert(todaySpend, dailyLimitOpts.dailyLimit).catch(() => {});
      });
    }

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updates, updated_at: now() } : t
    );
    persistTx(updated);
    const record = updated.find((t) => t.id === id);
    if (record) sync(apiRequest("PATCH", `/api/transactions/${id}`, record), "update transaction");
  };

  const deleteTransaction = (id: string) => {
    persistTx(transactions.filter((t) => t.id !== id));
    sync(apiRequest("DELETE", `/api/transactions/${id}`), "delete transaction");
  };

  const addTransfer = (transfer: Omit<Transfer, "id" | "created_at">): Transfer => {
    const newTransfer: Transfer = { ...transfer, id: generateId(), created_at: now() };
    persistTf([...transfers, newTransfer]);
    sync(apiRequest("POST", "/api/transfers", newTransfer), "create transfer");
    return newTransfer;
  };

  const deleteTransfer = (id: string) => {
    persistTf(transfers.filter((t) => t.id !== id));
    sync(apiRequest("DELETE", `/api/transfers/${id}`), "delete transfer");
  };

  const getTransactionsByAccount = (accountId: string) =>
    transactions.filter((t) => t.account_id === accountId);

  const getTransactionsByCategory = (categoryId: string) =>
    transactions.filter((t) => t.category_id === categoryId);

  const categoryIdsInUse = useMemo(
    () => [...new Set(transactions.map((t) => t.category_id).filter((id): id is string => !!id))],
    [transactions]
  );

  const clearAll = () => {
    persistTx([]);
    persistTf([]);
  };

  const value = useMemo(
    () => ({
      transactions,
      transfers,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addTransfer,
      deleteTransfer,
      getTransactionsByAccount,
      getTransactionsByCategory,
      categoryIdsInUse,
      clearAll,
      isLoaded,
    }),
    [transactions, transfers, isLoaded] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
