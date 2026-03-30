import React, { ReactNode, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import type { SavingsWallet, SavingsTransaction } from "@/types";
import { useAuth } from "@/store/AuthContext";
import { apiRequest } from "@/services/api";

export function SavingsProvider({ children }: { children: ReactNode }) {
  const setWallets = useStore((s) => s.setWallets);
  const setSavingsTransactions = useStore((s) => s.setSavingsTransactions);
  const { user } = useAuth();
  
  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        const [apiWallets, apiTxs] = await Promise.all([
          apiRequest("GET", "/api/savings-wallets").then((r) => r.json()).catch(() => null),
          apiRequest("GET", "/api/savings-transactions").then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        if (Array.isArray(apiWallets) && apiWallets.length > 0) setWallets(apiWallets);
        if (Array.isArray(apiTxs) && apiTxs.length > 0) setSavingsTransactions(apiTxs);
      } catch {
        // Ignore
      }
    }
    fetchLatest();
    return () => { cancelled = true; };
  }, [user]);

  return <>{children}</>;
}

export function useSavings() {
  const wallets = useStore((s) => s.wallets);
  const savingsTransactions = useStore((s) => s.savingsTransactions);
  const addWallet = useStore((s) => s.addWallet);
  const updateWallet = useStore((s) => s.updateWallet);
  const deleteWalletBase = useStore((s) => s.deleteWallet);
  const addSavingsTransaction = useStore((s) => s.addSavingsTransaction);
  const isLoaded = useStore((s) => s.isLoaded);

  const getWallet = (id: string) => wallets.find((w) => w.id === id);

  const deleteWallet = (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (wallet?.is_default) return;
    deleteWalletBase(id);
  };

  const getWalletTransactions = (walletId: string) =>
    savingsTransactions.filter((t) => t.wallet_id === walletId);

  const totalSavings = useMemo(
    () => wallets.filter((w) => !w.is_archived).reduce((sum, w) => sum + Number(w.current_amount), 0),
    [wallets]
  );

  return {
    wallets,
    savingsTransactions,
    addWallet,
    updateWallet,
    deleteWallet,
    getWallet,
    addSavingsTransaction,
    getWalletTransactions,
    totalSavings,
    clearAll: () => {},
    isLoaded,
  };
}
