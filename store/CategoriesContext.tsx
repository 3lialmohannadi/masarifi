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
import { createDefaultCategories, mergeDefaultCategories } from "@/utils/defaults";
import { apiRequest } from "@/lib/query-client";

interface CategoriesContextValue {
  categories: Category[];
  addCategory: (cat: Omit<Category, "id" | "created_at" | "updated_at">) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;
  getCategory: (id: string) => Category | undefined;
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
      .then(async (apiData: Category[]) => {
        if (apiData && apiData.length > 0) {
          const { merged, added } = mergeDefaultCategories(apiData);
          setCategories(merged);
          saveData(KEYS.CATEGORIES, merged);
          if (added > 0) {
            const newCats = merged.filter(
              (c) => !apiData.find((a) => a.id === c.id)
            );
            newCats.forEach((cat) =>
              apiRequest("POST", "/api/categories", cat).catch(() => {})
            );
          }
        } else {
          const local = await loadData<Category[]>(KEYS.CATEGORIES);
          if (local && local.length > 0) {
            const { merged } = mergeDefaultCategories(local);
            setCategories(merged);
            merged.forEach((cat) =>
              apiRequest("POST", "/api/categories", cat).catch(() => {})
            );
          } else {
            const defaults = createDefaultCategories();
            setCategories(defaults);
            saveData(KEYS.CATEGORIES, defaults);
            defaults.forEach((cat) =>
              apiRequest("POST", "/api/categories", cat).catch(() => {})
            );
          }
        }
      })
      .catch(() => {
        loadData<Category[]>(KEYS.CATEGORIES).then((saved) => {
          if (saved && saved.length > 0) {
            const { merged } = mergeDefaultCategories(saved);
            setCategories(merged);
          } else {
            const defaults = createDefaultCategories();
            setCategories(defaults);
            saveData(KEYS.CATEGORIES, defaults);
          }
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
    const cat = categories.find((c) => c.id === id);
    if (cat?.is_default) return false;
    persist(categories.filter((c) => c.id !== id));
    apiRequest("DELETE", `/api/categories/${id}`).catch(console.error);
    return true;
  };

  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const getCategoriesByType = (type: CategoryType) =>
    categories
      .filter((c) => c.type === type && c.is_active)
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
