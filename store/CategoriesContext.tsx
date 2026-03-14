import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { Category, CategoryType } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { apiRequest } from "@/services/api";
import { createSyncFn } from "@/utils/syncHelper";
import { useTransactions } from "@/store/TransactionsContext";
import { useAuth } from "@/store/AuthContext";

const GUEST_ID = "guest";

interface CategoriesContextValue {
  categories: Category[];
  addCategory: (cat: Omit<Category, "id" | "created_at" | "updated_at">) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;
  getCategory: (id?: string) => Category | undefined;
  getCategoriesByType: (type: CategoryType) => Category[];
  clearAll: () => void;
  isLoaded: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { categoryIdsInUse } = useTransactions();
  const { user } = useAuth();
  const userId = user?.id || GUEST_ID;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const sync = createSyncFn();

  useEffect(() => {
    setCategories([]);
    setIsLoaded(false);
    let cancelled = false;
    const storageKey = `${KEYS.CATEGORIES}_${userId}`;

    async function hydrate() {
      const local = await loadData<Category[]>(storageKey) || [];
      if (cancelled) return;
      if (local.length > 0) {
        setCategories(local);
        setIsLoaded(true);
        try {
          const res = await apiRequest("GET", "/api/categories");
          const apiData: Category[] = await res.json();
          if (cancelled) return;
          if (Array.isArray(apiData) && apiData.length > 0) {
            setCategories(apiData);
            saveData(storageKey, apiData);
          }
        } catch { /* keep local */ }
      } else {
        try {
          const res = await apiRequest("GET", "/api/categories");
          const apiData: Category[] = await res.json();
          if (cancelled) return;
          if (Array.isArray(apiData) && apiData.length > 0) {
            setCategories(apiData);
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

  const storageKey = `${KEYS.CATEGORIES}_${userId}`;

  const persist = (data: Category[]) => {
    setCategories(data);
    saveData(storageKey, data);
  };

  const addCategory = (cat: Omit<Category, "id" | "created_at" | "updated_at">): Category => {
    const newCat: Category = {
      ...cat,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persist([...categories, newCat]);
    sync(apiRequest("POST", "/api/categories", newCat), "create category");
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, ...updates, updated_at: now() } : c
    );
    persist(updated);
    const record = updated.find((c) => c.id === id);
    if (record) sync(apiRequest("PATCH", `/api/categories/${id}`, record), "update category");
  };

  const deleteCategory = (id: string): boolean => {
    if (categoryIdsInUse.includes(id)) return false;
    persist(categories.filter((c) => c.id !== id));
    sync(apiRequest("DELETE", `/api/categories/${id}`), "delete category");
    return true;
  };

  const getCategory = (id?: string) => id ? categories.find((c) => c.id === id) : undefined;

  const getCategoriesByType = (type: CategoryType) => categories.filter((c) => c.type === type);

  const clearAll = () => {
    persist([]);
  };

  const value = useMemo(
    () => ({
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategory,
      getCategoriesByType,
      clearAll,
      isLoaded,
    }),
    [categories, categoryIdsInUse, isLoaded] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
