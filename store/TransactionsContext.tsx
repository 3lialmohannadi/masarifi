import React, { ReactNode, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";
import type { Transaction, Transfer } from "@/types";
import { useAuth } from "@/store/AuthContext";
import { apiRequest } from "@/services/api";

// We keep the provider so we don't break _layout imports, but it does nothing wrapper-wise.
export function TransactionsProvider({ children }: { children: ReactNode }) {
  const setTransactions = useStore((s) => s.setTransactions);
  const setTransfers = useStore((s) => s.setTransfers);
  const { user } = useAuth();
  
  // Opportunistic fetch on mount to get latest from server
  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        const [apiTx, apiTf] = await Promise.all([
          apiRequest("GET", "/api/transactions").then((r) => r.json()).catch(() => null),
          apiRequest("GET", "/api/transfers").then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        if (Array.isArray(apiTx) && apiTx.length > 0) setTransactions(apiTx);
        if (Array.isArray(apiTf) && apiTf.length > 0) setTransfers(apiTf);
      } catch {
        // Ignore
      }
    }
    fetchLatest();
    return () => { cancelled = true; };
  }, [user]);

  return <>{children}</>;
}

export function useTransactions() {
  const transactions = useStore((s) => s.transactions);
  const transfers = useStore((s) => s.transfers);
  const addTransactionNative = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const addTransfer = useStore((s) => s.addTransfer);
  const deleteTransfer = useStore((s) => s.deleteTransfer);
  const isLoaded = useStore((s) => s.isLoaded);
  
  // Backwards compat daily limit wrapping
  const addTransaction = (
    tx: Omit<Transaction, "id" | "created_at" | "updated_at">,
    dailyLimitOpts?: { enabled: boolean; dailyLimit: number }
  ) => {
    const newTx = addTransactionNative(tx);
    if (
      tx.type === "expense" &&
      dailyLimitOpts?.enabled &&
      dailyLimitOpts.dailyLimit > 0
    ) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaySpend = useStore.getState().transactions
        .filter((t: Transaction) => t.type === "expense" && t.date.startsWith(todayStr))
        .reduce((s: number, t: Transaction) => s + t.amount, 0);
      import("@/utils/notifications").then(({ checkDailyLimitAlert }) => {
        checkDailyLimitAlert(todaySpend, dailyLimitOpts.dailyLimit).catch(() => {});
      });
    }
    return newTx;
  };

  const getTransactionsByAccount = (accountId: string) =>
    transactions.filter((t) => t.account_id === accountId);

  const getTransactionsByCategory = (categoryId: string) =>
    transactions.filter((t) => t.category_id === categoryId);

  const categoryIdsInUse = useMemo(
    () => [...new Set(transactions.map((t) => t.category_id).filter((id): id is string => !!id))],
    [transactions]
  );

  return {
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
    clearAll: () => {},
    isLoaded,
  };
}
