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
import { useTransactions } from "@/store/TransactionsContext";

interface CategoriesContextValue {
  categories: Category[];
  addCategory: (cat: Omit<Category, "id" | "created_at" | "updated_at">) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;
  getCategory: (id?: string) => Category | undefined;
  getCategoriesByType: (type: CategoryType) => Category[];
  isLoaded: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { categoryIdsInUse } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const local = await loadData<Category[]>(KEYS.CATEGORIES) || [];
      if (local.length > 0) {
        setCategories(local);
        setIsLoaded(true);
        apiRequest("GET", "/api/categories")
          .then((r) => r.json())
          .then((apiData: Category[]) => {
            if (Array.isArray(apiData)) {
              const serverMap = new Map(apiData.map((c) => [c.id, c]));
              local.forEach((c) => {
                const onServer = serverMap.get(c.id);
                if (!onServer) {
                  apiRequest("POST", "/api/categories", c).catch(() => {});
                } else if (onServer.updated_at !== c.updated_at) {
                  apiRequest("PATCH", `/api/categories/${c.id}`, c).catch(() => {});
                }
              });
            }
          })
          .catch(() => {});
      } else {
        try {
          const res = await apiRequest("GET", "/api/categories");
          const apiData: Category[] = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            setCategories(apiData);
            saveData(KEYS.CATEGORIES, apiData);
          }
        } catch {
          // server unavailable — start with empty state
        }
        setIsLoaded(true);
      }
    }
    hydrate();
  }, []);

  const persist = (data: Category[]) => {
    setCategories(data);
    saveData(KEYS.CATEGORIES, data);
  };

  const addCategory = (cat: Omit<Category, "id" | "created_at" | "updated_at">): Category => {
    const newCat: Category = {
      ...cat,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persist([...categories, newCat]);
    apiRequest("POST", "/api/categories", newCat).catch(console.error);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, ...updates, updated_at: now() } : c
    );
    persist(updated);
    const record = updated.find((c) => c.id === id);
    if (record) apiRequest("PATCH", `/api/categories/${id}`, record).catch(console.error);
  };

  const deleteCategory = (id: string): boolean => {
    if (categoryIdsInUse.includes(id)) return false;
    persist(categories.filter((c) => c.id !== id));
    apiRequest("DELETE", `/api/categories/${id}`).catch(console.error);
    return true;
  };

  const getCategory = (id?: string) => id ? categories.find((c) => c.id === id) : undefined;

  const getCategoriesByType = (_type: CategoryType) => [...categories];

  const value = useMemo(
    () => ({
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategory,
      getCategoriesByType,
      isLoaded,
    }),
    [categories, categoryIdsInUse, isLoaded]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
