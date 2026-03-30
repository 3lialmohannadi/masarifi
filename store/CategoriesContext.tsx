import React, { ReactNode, useEffect } from "react";
import { useStore } from "@/store/useStore";
import type { Category, CategoryType } from "@/types";
import { useTransactions } from "@/store/TransactionsContext";
import { useAuth } from "@/store/AuthContext";
import { apiRequest } from "@/services/api";

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const setCategories = useStore((s) => s.setCategories);
  const { user } = useAuth();
  
  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        const res = await apiRequest("GET", "/api/categories");
        const apiData: Category[] = await res.json();
        if (cancelled) return;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setCategories(apiData);
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

export function useCategories() {
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategoryBase = useStore((s) => s.deleteCategory);
  const isLoaded = useStore((s) => s.isLoaded);
  
  const { categoryIdsInUse } = useTransactions();

  const getCategory = (id?: string) => id ? categories.find((c) => c.id === id) : undefined;
  const getCategoriesByType = (type: CategoryType) => categories.filter((c) => c.type === type);

  const deleteCategory = (id: string): boolean => {
    if (categoryIdsInUse.includes(id)) return false;
    deleteCategoryBase(id);
    return true;
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    getCategoriesByType,
    clearAll: () => {},
    isLoaded,
  };
}
