import React, { ReactNode, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import type { Budget } from "@/types";
import { useAuth } from "@/store/AuthContext";
import { apiRequest } from "@/services/api";

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const setBudgets = useStore((s) => s.setBudgets);
  const { user } = useAuth();
  
  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        const res = await apiRequest("GET", "/api/budgets");
        const apiData: Budget[] = await res.json();
        if (cancelled) return;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setBudgets(apiData);
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

export function useBudgets() {
  const budgets = useStore((s) => s.budgets);
  const addBudget = useStore((s) => s.addBudget);
  const updateBudget = useStore((s) => s.updateBudget);
  const deleteBudget = useStore((s) => s.deleteBudget);
  const isLoaded = useStore((s) => s.isLoaded);

  const getBudgetForCategory = (categoryId: string, monthKey: string): Budget | undefined =>
    budgets.find((b) => b.category_id === categoryId && b.month === monthKey);

  const upsertBudget = (categoryId: string, amount: number, monthKey: string) => {
    const existing = budgets.find(
      (b) => b.category_id === categoryId && b.month === monthKey
    );

    if (existing) {
      updateBudget(existing.id, { amount });
    } else {
      addBudget({
        category_id: categoryId,
        amount,
        month: monthKey,
      });
    }
  };

  return {
    budgets,
    upsertBudget,
    deleteBudget,
    getBudgetForCategory,
    isLoaded,
  };
}
