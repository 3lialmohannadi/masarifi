import type { Category, SavingsWallet } from "@/types";
import { now } from "./id";

function def(
  id: string,
  name_ar: string,
  name_en: string,
  icon: string,
  color: string,
  type: Category["type"],
  is_favorite = false
): Category {
  return {
    id,
    name_ar,
    name_en,
    icon,
    color,
    type,
    is_default: true,
    is_active: true,
    is_favorite,
    created_at: now(),
    updated_at: now(),
  };
}

export const DEFAULT_CATEGORIES: Category[] = [];

export function createDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c, created_at: now(), updated_at: now() }));
}

export function mergeDefaultCategories(saved: Category[]): { merged: Category[]; added: number } {
  const existingIds = new Set(saved.map((c) => c.id));
  const missing = DEFAULT_CATEGORIES.filter((d) => !existingIds.has(d.id)).map((d) => ({
    ...d,
    created_at: now(),
    updated_at: now(),
  }));
  return { merged: [...saved, ...missing], added: missing.length };
}

export function createDefaultSavingsWallet(): SavingsWallet {
  return {
    id: "general-savings-default",
    name_ar: "التوفير العام",
    name_en: "General Savings",
    description: "",
    type: "general_savings",
    current_amount: 0,
    color: "#3B82F6",
    icon: "dollar-sign",
    is_default: true,
    is_archived: false,
    created_at: now(),
    updated_at: now(),
  };
}

export const SMART_SUGGESTIONS: Record<string, string[]> = {
  uber: ["مواصلات", "Transport"],
  careem: ["مواصلات", "Transport"],
  starbucks: ["قهوة", "Coffee"],
  "mcdonald": ["مطاعم", "Restaurants"],
  "mcdonalds": ["مطاعم", "Restaurants"],
  kfc: ["مطاعم", "Restaurants"],
  netflix: ["اشتراكات", "Subscriptions"],
  spotify: ["اشتراكات", "Subscriptions"],
  fuel: ["وقود", "Fuel"],
  petrol: ["وقود", "Fuel"],
  pharmacy: ["صحة", "Health"],
  hospital: ["صحة", "Health"],
  amazon: ["تسوق", "Shopping"],
  noon: ["تسوق", "Shopping"],
};
