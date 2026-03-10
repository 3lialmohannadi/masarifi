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
import { apiRequest } from "@/lib/query-client";

interface TransactionsContextValue {
  transactions: Transaction[];
  transfers: Transfer[];
  addTransaction: (tx: Omit<Transaction, "id" | "created_at" | "updated_at">) => Transaction;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest("GET", "/api/transactions").then((r) => r.json()).catch(() => null),
      apiRequest("GET", "/api/transfers").then((r) => r.json()).catch(() => null),
    ]).then(async ([apiTx, apiTf]) => {
      if (apiTx && apiTx.length > 0) {
        setTransactions(apiTx);
        saveData(KEYS.TRANSACTIONS, apiTx);
      } else {
        const local = await loadData<Transaction[]>(KEYS.TRANSACTIONS);
        if (local && local.length > 0) {
          setTransactions(local);
          local.forEach((item) =>
            apiRequest("POST", "/api/transactions", item).catch(() => {})
          );
        }
      }

      if (apiTf && apiTf.length > 0) {
        setTransfers(apiTf);
        saveData(KEYS.TRANSFERS, apiTf);
      } else {
        const local = await loadData<Transfer[]>(KEYS.TRANSFERS);
        if (local && local.length > 0) {
          setTransfers(local);
          local.forEach((item) =>
            apiRequest("POST", "/api/transfers", item).catch(() => {})
          );
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const persistTx = (data: Transaction[]) => {
    setTransactions(data);
    saveData(KEYS.TRANSACTIONS, data);
  };

  const persistTf = (data: Transfer[]) => {
    setTransfers(data);
    saveData(KEYS.TRANSFERS, data);
  };

  const addTransaction = (tx: Omit<Transaction, "id" | "created_at" | "updated_at">): Transaction => {
    const newTx: Transaction = {
      ...tx,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persistTx([...transactions, newTx]);
    apiRequest("POST", "/api/transactions", newTx).catch(console.error);
    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updates, updated_at: now() } : t
    );
    persistTx(updated);
    const record = updated.find((t) => t.id === id);
    if (record) apiRequest("PATCH", `/api/transactions/${id}`, record).catch(console.error);
  };

  const deleteTransaction = (id: string) => {
    persistTx(transactions.filter((t) => t.id !== id));
    apiRequest("DELETE", `/api/transactions/${id}`).catch(console.error);
  };

  const addTransfer = (tf: Omit<Transfer, "id" | "created_at">): Transfer => {
    const newTf: Transfer = { ...tf, id: generateId(), created_at: now() };
    persistTf([...transfers, newTf]);
    apiRequest("POST", "/api/transfers", newTf).catch(console.error);
    return newTf;
  };

  const deleteTransfer = (id: string) => {
    persistTf(transfers.filter((t) => t.id !== id));
    apiRequest("DELETE", `/api/transfers/${id}`).catch(console.error);
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
    [transactions, transfers, isLoaded]
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
