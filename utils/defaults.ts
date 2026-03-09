import type { Category, SavingsWallet } from "@/types";
import { generateId, now } from "./id";

export function createDefaultCategories(): Category[] {
  return [
    // Income
    { id: generateId(), name_ar: "راتب", name_en: "Salary", icon: "briefcase", color: "#22C55E", type: "income", is_default: true, is_active: true, is_favorite: true, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "مكافأة", name_en: "Bonus", icon: "gift", color: "#10B981", type: "income", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "استثمار", name_en: "Investment", icon: "trending-up", color: "#3B82F6", type: "income", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "دخل آخر", name_en: "Other Income", icon: "plus-circle", color: "#06B6D4", type: "income", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    // Expense
    { id: generateId(), name_ar: "مطاعم", name_en: "Restaurants", icon: "coffee", color: "#F97316", type: "expense", is_default: true, is_active: true, is_favorite: true, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "سوبرماركت", name_en: "Supermarket", icon: "shopping-cart", color: "#EF4444", type: "expense", is_default: true, is_active: true, is_favorite: true, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "مواصلات", name_en: "Transport", icon: "truck", color: "#8B5CF6", type: "expense", is_default: true, is_active: true, is_favorite: true, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "وقود", name_en: "Fuel", icon: "zap", color: "#F59E0B", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "تسوق", name_en: "Shopping", icon: "shopping-bag", color: "#EC4899", type: "expense", is_default: true, is_active: true, is_favorite: true, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "فواتير", name_en: "Bills", icon: "file-text", color: "#6366F1", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "صحة", name_en: "Health", icon: "heart", color: "#EF4444", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "ترفيه", name_en: "Entertainment", icon: "film", color: "#F97316", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "تعليم", name_en: "Education", icon: "book", color: "#3B82F6", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "قهوة", name_en: "Coffee", icon: "coffee", color: "#92400E", type: "expense", is_default: true, is_active: true, is_favorite: true, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "اشتراكات", name_en: "Subscriptions", icon: "repeat", color: "#7C3AED", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "سفر", name_en: "Travel", icon: "map-pin", color: "#0EA5E9", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "مصروف آخر", name_en: "Other Expense", icon: "more-horizontal", color: "#64748B", type: "expense", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    // Savings
    { id: generateId(), name_ar: "ادخار", name_en: "Savings", icon: "dollar-sign", color: "#3B82F6", type: "savings", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    // Commitment
    { id: generateId(), name_ar: "إيجار", name_en: "Rent", icon: "home", color: "#F59E0B", type: "commitment", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "قسط", name_en: "Installment", icon: "credit-card", color: "#F97316", type: "commitment", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    { id: generateId(), name_ar: "تأمين", name_en: "Insurance", icon: "shield", color: "#10B981", type: "commitment", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
    // Plan
    { id: generateId(), name_ar: "تخطيط مالي", name_en: "Financial Plan", icon: "target", color: "#8B5CF6", type: "plan", is_default: true, is_active: true, is_favorite: false, created_at: now(), updated_at: now() },
  ];
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
