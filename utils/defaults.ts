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

export const DEFAULT_CATEGORIES: Category[] = [
  // ─── Income ──────────────────────────────────
  def("cat-income-salary",       "راتب",         "Salary",          "briefcase",     "#22C55E", "income", true),
  def("cat-income-bonus",        "مكافأة",        "Bonus",           "gift",          "#10B981", "income"),
  def("cat-income-investment",   "استثمار",       "Investment",      "trending-up",   "#3B82F6", "income"),
  def("cat-income-freelance",    "عمل حر",        "Freelance",       "feather",       "#8B5CF6", "income"),
  def("cat-income-rental",       "إيجار مستلم",   "Rental Income",   "home",          "#06B6D4", "income"),
  def("cat-income-other",        "دخل آخر",       "Other Income",    "plus-circle",   "#64748B", "income"),

  // ─── Expense ─────────────────────────────────
  def("cat-exp-restaurants",     "مطاعم",         "Restaurants",     "coffee",        "#F97316", "expense", true),
  def("cat-exp-supermarket",     "سوبرماركت",     "Supermarket",     "shopping-cart", "#EF4444", "expense", true),
  def("cat-exp-transport",       "مواصلات",       "Transport",       "truck",         "#8B5CF6", "expense", true),
  def("cat-exp-fuel",            "وقود",          "Fuel",            "zap",           "#F59E0B", "expense"),
  def("cat-exp-shopping",        "تسوق",          "Shopping",        "shopping-bag",  "#EC4899", "expense", true),
  def("cat-exp-bills",           "فواتير",        "Bills",           "file-text",     "#6366F1", "expense"),
  def("cat-exp-health",          "صحة",           "Health",          "heart",         "#EF4444", "expense"),
  def("cat-exp-entertainment",   "ترفيه",         "Entertainment",   "film",          "#F97316", "expense"),
  def("cat-exp-education",       "تعليم",         "Education",       "book",          "#3B82F6", "expense"),
  def("cat-exp-coffee",          "قهوة",          "Coffee",          "coffee",        "#92400E", "expense", true),
  def("cat-exp-subscriptions",   "اشتراكات",      "Subscriptions",   "repeat",        "#7C3AED", "expense"),
  def("cat-exp-travel",          "سفر",           "Travel",          "map-pin",       "#0EA5E9", "expense"),
  def("cat-exp-clothing",        "ملابس",         "Clothing",        "scissors",      "#DB2777", "expense"),
  def("cat-exp-gifts",           "هدايا",         "Gifts",           "gift",          "#F43F5E", "expense"),
  def("cat-exp-maintenance",     "صيانة",         "Maintenance",     "tool",          "#84CC16", "expense"),
  def("cat-exp-other",           "مصروف آخر",     "Other Expense",   "more-horizontal","#64748B", "expense"),

  // ─── Savings ─────────────────────────────────
  def("cat-sav-general",         "ادخار عام",     "General Savings", "dollar-sign",   "#3B82F6", "savings", true),
  def("cat-sav-emergency",       "صندوق طوارئ",   "Emergency Fund",  "shield",        "#EF4444", "savings"),
  def("cat-sav-goal",            "هدف ادخار",     "Savings Goal",    "target",        "#10B981", "savings"),
  def("cat-sav-investment",      "ادخار للاستثمار","Investment Save", "trending-up",  "#8B5CF6", "savings"),
  def("cat-sav-travel",          "ادخار سفر",     "Travel Fund",     "map-pin",       "#0EA5E9", "savings"),

  // ─── Commitment ──────────────────────────────
  def("cat-com-rent",            "إيجار",         "Rent",            "home",          "#F59E0B", "commitment", true),
  def("cat-com-installment",     "قسط",           "Installment",     "credit-card",   "#F97316", "commitment"),
  def("cat-com-insurance",       "تأمين",         "Insurance",       "shield",        "#10B981", "commitment"),
  def("cat-com-utilities",       "خدمات (كهرباء/ماء)", "Utilities",  "zap",           "#6366F1", "commitment"),
  def("cat-com-internet",        "إنترنت",        "Internet",        "wifi",          "#0EA5E9", "commitment"),
  def("cat-com-phone",           "هاتف",          "Phone Bill",      "phone",         "#8B5CF6", "commitment"),
  def("cat-com-subscription",    "اشتراك دوري",   "Subscription",    "repeat",        "#7C3AED", "commitment"),
  def("cat-com-loan",            "قرض",           "Loan",            "activity",      "#EF4444", "commitment"),
  def("cat-com-other",           "التزام آخر",    "Other Commitment","more-horizontal","#64748B", "commitment"),

  // ─── Plan ────────────────────────────────────
  def("cat-plan-travel",         "خطة سفر",       "Travel Plan",     "map-pin",       "#0EA5E9", "plan", true),
  def("cat-plan-wedding",        "زفاف",          "Wedding",         "heart",         "#EC4899", "plan"),
  def("cat-plan-car",            "سيارة",         "Car",             "truck",         "#F59E0B", "plan"),
  def("cat-plan-house",          "منزل",          "House",           "home",          "#10B981", "plan"),
  def("cat-plan-education",      "تعليم",         "Education",       "book",          "#3B82F6", "plan"),
  def("cat-plan-business",       "مشروع",         "Business",        "briefcase",     "#8B5CF6", "plan"),
  def("cat-plan-medical",        "طبي",           "Medical",         "heart",         "#EF4444", "plan"),
  def("cat-plan-other",          "خطة أخرى",      "Other Plan",      "target",        "#64748B", "plan"),
];

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
