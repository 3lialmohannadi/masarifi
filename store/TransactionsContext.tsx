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
  const sync = createSyncFn();

  useEffect(() => {
    async function hydrate() {
      const localTx = await loadData<Transaction[]>(KEYS.TRANSACTIONS) || [];
      const localTf = await loadData<Transfer[]>(KEYS.TRANSFERS) || [];
      const hasLocal = localTx.length > 0 || localTf.length > 0;
      if (hasLocal) {
        setTransactions(localTx);
        setTransfers(localTf);
        setIsLoaded(true);
        Promise.all([
          apiRequest("GET", "/api/transactions").then((r) => r.json()).catch(() => null),
          apiRequest("GET", "/api/transfers").then((r) => r.json()).catch(() => null),
        ]).then(([apiTx, apiTf]) => {
          if (Array.isArray(apiTx)) {
            const serverMap = new Map(apiTx.map((t) => [t.id, t]));
            const localIds = new Set(localTx.map((t) => t.id));
            localTx.forEach((t) => {
              const onServer = serverMap.get(t.id);
              if (!onServer) {
                apiRequest("POST", "/api/transactions", t).catch(() => {});
              } else if (onServer.updated_at !== t.updated_at) {
                apiRequest("PATCH", `/api/transactions/${t.id}`, t).catch(() => {});
              }
            });
            apiTx.filter((t) => !localIds.has(t.id)).forEach((t) =>
              apiRequest("DELETE", `/api/transactions/${t.id}`).catch(() => {})
            );
          }
          if (Array.isArray(apiTf)) {
            const serverIds = new Set(apiTf.map((t) => t.id));
            const localTfIds = new Set(localTf.map((t) => t.id));
            localTf.filter((t) => !serverIds.has(t.id)).forEach((t) =>
              apiRequest("POST", "/api/transfers", t).catch(() => {})
            );
            apiTf.filter((t) => !localTfIds.has(t.id)).forEach((t) =>
              apiRequest("DELETE", `/api/transfers/${t.id}`).catch(() => {})
            );
          }
        }).catch(() => {});
      } else {
        try {
          const [apiTx, apiTf] = await Promise.all([
            apiRequest("GET", "/api/transactions").then((r) => r.json()).catch(() => null),
            apiRequest("GET", "/api/transfers").then((r) => r.json()).catch(() => null),
          ]);
          if (Array.isArray(apiTx) && apiTx.length > 0) {
            setTransactions(apiTx);
            saveData(KEYS.TRANSACTIONS, apiTx);
          }
          if (Array.isArray(apiTf) && apiTf.length > 0) {
            setTransfers(apiTf);
            saveData(KEYS.TRANSFERS, apiTf);
          }
        } catch {
          // server unavailable — start with empty state
        }
        setIsLoaded(true);
      }
    }
    hydrate();
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
    sync(apiRequest("POST", "/api/transactions", newTx), "create transaction");
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
    [transactions, transfers, isLoaded]
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
