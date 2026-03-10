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
import { apiRequest } from "@/lib/query-client";

interface CategoriesContextValue {
  categories: Category[];
  addCategory: (cat: Omit<Category, "id" | "created_at" | "updated_at">) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;
  getCategory: (id?: string) => Category | undefined;
  getCategoriesByType: (type: CategoryType) => Category[];
  toggleFavorite: (id: string) => void;
  isLoaded: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({
  children,
  transactionCategoryIds,
}: {
  children: ReactNode;
  transactionCategoryIds: string[];
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    apiRequest("GET", "/api/categories")
      .then((res) => res.json())
      .then((apiData: Category[]) => {
        if (apiData && apiData.length > 0) {
          setCategories(apiData);
          saveData(KEYS.CATEGORIES, apiData);
        } else {
          setCategories([]);
          saveData(KEYS.CATEGORIES, []);
        }
      })
      .catch(() => {
        loadData<Category[]>(KEYS.CATEGORIES).then((saved) => {
          setCategories(saved && saved.length > 0 ? saved : []);
        });
      })
      .finally(() => setIsLoaded(true));
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
    if (transactionCategoryIds.includes(id)) return false;
    persist(categories.filter((c) => c.id !== id));
    apiRequest("DELETE", `/api/categories/${id}`).catch(console.error);
    return true;
  };

  const getCategory = (id?: string) => id ? categories.find((c) => c.id === id) : undefined;

  const getCategoriesByType = (_type: CategoryType) =>
    categories
      .filter((c) => c.is_active)
      .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));

  const toggleFavorite = (id: string) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, is_favorite: !c.is_favorite, updated_at: now() } : c
    );
    persist(updated);
    const record = updated.find((c) => c.id === id);
    if (record) apiRequest("PATCH", `/api/categories/${id}`, record).catch(console.error);
  };

  const value = useMemo(
    () => ({
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategory,
      getCategoriesByType,
      toggleFavorite,
      isLoaded,
    }),
    [categories, transactionCategoryIds, isLoaded]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
