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
import { apiRequest } from "@/services/api";
import { createSyncFn } from "@/utils/syncHelper";
import { useAuth } from "@/store/AuthContext";

const GUEST_ID = "guest";

interface BudgetsContextValue {
  budgets: Budget[];
  upsertBudget: (categoryId: string, amount: number, monthKey: string) => void;
  deleteBudget: (id: string) => void;
  getBudgetForCategory: (categoryId: string, monthKey: string) => Budget | undefined;
  isLoaded: boolean;
}

const BudgetsContext = createContext<BudgetsContextValue | null>(null);

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || GUEST_ID;

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const sync = createSyncFn();

  const storageKey = `${KEYS.BUDGETS}_${userId}`;

  useEffect(() => {
    setBudgets([]);
    setIsLoaded(false);
    let cancelled = false;

    async function hydrate() {
      const local = await loadData<Budget[]>(storageKey) || [];
      if (cancelled) return;
      if (local.length > 0) {
        setBudgets(local);
        setIsLoaded(true);
        try {
          const res = await apiRequest("GET", "/api/budgets");
          const apiData: Budget[] = await res.json();
          if (cancelled) return;
          if (Array.isArray(apiData)) {
            setBudgets(apiData);
            saveData(storageKey, apiData);
          }
        } catch { /* keep local */ }
      } else {
        try {
          const res = await apiRequest("GET", "/api/budgets");
          const apiData: Budget[] = await res.json();
          if (cancelled) return;
          if (Array.isArray(apiData)) {
            setBudgets(apiData);
            saveData(storageKey, apiData);
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

  const persist = (data: Budget[]) => {
    setBudgets(data);
    saveData(storageKey, data);
  };

  const upsertBudget = (categoryId: string, amount: number, monthKey: string) => {
    const existing = budgets.find(
      (b) => b.category_id === categoryId && b.month === monthKey
    );

    if (existing) {
      const updated = budgets.map((b) =>
        b.id === existing.id ? { ...b, amount, updated_at: now() } : b
      );
      persist(updated);
      sync(
        apiRequest("POST", "/api/budgets", { category_id: categoryId, amount, month: monthKey })
          .then(async (res) => {
            const serverBudget: Budget = await res.json();
            setBudgets((prev) => {
              const refreshed = prev.map((b) => (b.id === existing.id ? serverBudget : b));
              saveData(storageKey, refreshed);
              return refreshed;
            });
          }),
        "upsert budget"
      );
    } else {
      const newBudget: Budget = {
        id: generateId(),
        category_id: categoryId,
        amount,
        month: monthKey,
        created_at: now(),
        updated_at: now(),
      };
      persist([...budgets, newBudget]);
      sync(
        apiRequest("POST", "/api/budgets", { category_id: categoryId, amount, month: monthKey })
          .then(async (res) => {
            const serverBudget: Budget = await res.json();
            setBudgets((prev) => {
              const refreshed = prev.map((b) => (b.id === newBudget.id ? serverBudget : b));
              saveData(storageKey, refreshed);
              return refreshed;
            });
          }),
        "upsert budget"
      );
    }
  };

  const deleteBudget = (id: string) => {
    persist(budgets.filter((b) => b.id !== id));
    sync(apiRequest("DELETE", `/api/budgets/${id}`), "delete budget");
  };

  const getBudgetForCategory = (categoryId: string, monthKey: string): Budget | undefined =>
    budgets.find((b) => b.category_id === categoryId && b.month === monthKey);

  const value = useMemo(
    () => ({
      budgets,
      upsertBudget,
      deleteBudget,
      getBudgetForCategory,
      isLoaded,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [budgets, isLoaded]
  );

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext);
  if (!ctx) throw new Error("useBudgets must be used within BudgetsProvider");
  return ctx;
}
