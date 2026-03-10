import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { Budget } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { getMonthKey } from "@/utils/date";
import { apiRequest } from "@/lib/query-client";

interface BudgetsContextValue {
  budgets: Budget[];
  addBudget: (b: Omit<Budget, "id" | "created_at" | "updated_at">) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetForCategory: (categoryId: string, month?: string) => Budget | undefined;
  getCurrentMonthBudgets: () => Budget[];
  isLoaded: boolean;
}

const BudgetsContext = createContext<BudgetsContextValue | null>(null);

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    apiRequest("GET", "/api/budgets")
      .then((res) => res.json())
      .then(async (apiData: Budget[]) => {
        if (apiData && apiData.length > 0) {
          setBudgets(apiData);
          saveData(KEYS.BUDGETS, apiData);
        } else {
          const local = await loadData<Budget[]>(KEYS.BUDGETS);
          if (local && local.length > 0) {
            setBudgets(local);
            local.forEach((item) =>
              apiRequest("POST", "/api/budgets", item).catch(() => {})
            );
          }
        }
      })
      .catch(() => {
        loadData<Budget[]>(KEYS.BUDGETS).then((saved) => {
          setBudgets(saved || []);
        });
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = (data: Budget[]) => {
    setBudgets(data);
    saveData(KEYS.BUDGETS, data);
  };

  const addBudget = (b: Omit<Budget, "id" | "created_at" | "updated_at">): Budget => {
    const existing = budgets.find(
      (existing) => existing.category_id === b.category_id && existing.month === b.month
    );
    if (existing) {
      const updated = budgets.map((budget) =>
        budget.id === existing.id ? { ...budget, amount: b.amount, updated_at: now() } : budget
      );
      persist(updated);
      apiRequest("PATCH", `/api/budgets/${existing.id}`, { amount: b.amount }).catch(console.error);
      return { ...existing, amount: b.amount };
    }
    const newBudget: Budget = {
      ...b,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persist([...budgets, newBudget]);
    apiRequest("POST", "/api/budgets", newBudget).catch(console.error);
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    const updated = budgets.map((b) =>
      b.id === id ? { ...b, ...updates, updated_at: now() } : b
    );
    persist(updated);
    apiRequest("PATCH", `/api/budgets/${id}`, updates).catch(console.error);
  };

  const deleteBudget = (id: string) => {
    persist(budgets.filter((b) => b.id !== id));
    apiRequest("DELETE", `/api/budgets/${id}`).catch(console.error);
  };

  const getBudgetForCategory = (categoryId: string, month?: string) => {
    const targetMonth = month || getMonthKey();
    return budgets.find((b) => b.category_id === categoryId && b.month === targetMonth);
  };

  const getCurrentMonthBudgets = () => {
    const currentMonth = getMonthKey();
    return budgets.filter((b) => b.month === currentMonth);
  };

  const value = useMemo(
    () => ({
      budgets,
      addBudget,
      updateBudget,
      deleteBudget,
      getBudgetForCategory,
      getCurrentMonthBudgets,
      isLoaded,
    }),
    [budgets, isLoaded]
  );

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext);
  if (!ctx) throw new Error("useBudgets must be used within BudgetsProvider");
  return ctx;
}
