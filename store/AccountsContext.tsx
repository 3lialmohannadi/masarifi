import React, { ReactNode, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import type { Account } from "@/types";
import { useAuth } from "@/store/AuthContext";
import { apiRequest } from "@/services/api";

export function AccountsProvider({ children }: { children: ReactNode }) {
  const setAccounts = useStore((s) => s.setAccounts);
  const { user } = useAuth();
  
  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        const res = await apiRequest("GET", "/api/accounts");
        const apiData: Account[] = await res.json();
        if (cancelled) return;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setAccounts(apiData);
        }
      } catch {
        // Ignore
      }
    }
    fetchLatest();
    return () => { cancelled = true; };
  }, [user]);

  return <>{children}</>;
}

export function useAccounts() {
  const accounts = useStore((s) => s.accounts);
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const updateBalance = useStore((s) => s.updateBalance);
  const isLoaded = useStore((s) => s.isLoaded);

  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  return {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccount,
    updateBalance,
    clearAll: () => {},
    isLoaded,
    syncError: null,
  };
}
