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
  isLoaded: boolean;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadData<Transaction[]>(KEYS.TRANSACTIONS),
      loadData<Transfer[]>(KEYS.TRANSFERS),
    ]).then(([tx, tf]) => {
      setTransactions(tx || []);
      setTransfers(tf || []);
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

  const addTransaction = (tx: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
    const newTx: Transaction = {
      ...tx,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persistTx([...transactions, newTx]);
    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    persistTx(
      transactions.map((t) => (t.id === id ? { ...t, ...updates, updated_at: now() } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    persistTx(transactions.filter((t) => t.id !== id));
  };

  const addTransfer = (tf: Omit<Transfer, "id" | "created_at">) => {
    const newTf: Transfer = { ...tf, id: generateId(), created_at: now() };
    persistTf([...transfers, newTf]);
    return newTf;
  };

  const deleteTransfer = (id: string) => {
    persistTf(transfers.filter((t) => t.id !== id));
  };

  const getTransactionsByAccount = (accountId: string) =>
    transactions.filter((t) => t.account_id === accountId);

  const getTransactionsByCategory = (categoryId: string) =>
    transactions.filter((t) => t.category_id === categoryId);

  const categoryIdsInUse = useMemo(
    () => [...new Set(transactions.map((t) => t.category_id))],
    [transactions]
  );

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
