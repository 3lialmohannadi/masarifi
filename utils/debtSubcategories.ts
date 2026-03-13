import type { DebtCategory } from "@/types";

export interface SubcategoryDef {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
}

export const BANK_SUBCATEGORIES: SubcategoryDef[] = [
  { key: "personal_loan",    nameAr: "قرض شخصي",         nameEn: "Personal Loan",     icon: "dollar-sign",      color: "#3B82F6" },
  { key: "car_loan",         nameAr: "قرض سيارة",         nameEn: "Car Loan",          icon: "disc",             color: "#8B5CF6" },
  { key: "mortgage",         nameAr: "رهن عقاري",         nameEn: "Mortgage",          icon: "home",             color: "#F59E0B" },
  { key: "credit_card",      nameAr: "بطاقة ائتمان",      nameEn: "Credit Card",       icon: "credit-card",      color: "#EF4444" },
  { key: "installments",     nameAr: "أقساط",             nameEn: "Installments",      icon: "repeat",           color: "#10B981" },
  { key: "overdue_payments", nameAr: "مدفوعات متأخرة",   nameEn: "Overdue Payments",  icon: "alert-circle",     color: "#F97316" },
  { key: "interest",         nameAr: "فوائد",             nameEn: "Interest",          icon: "percent",          color: "#EC4899" },
  { key: "commercial_loan",  nameAr: "قرض تجاري",         nameEn: "Commercial Loan",   icon: "briefcase",        color: "#6366F1" },
];

export const PERSONAL_SUBCATEGORIES: SubcategoryDef[] = [
  { key: "friend",           nameAr: "صديق",              nameEn: "Friend",            icon: "users",            color: "#2F8F83" },
  { key: "family",           nameAr: "عائلة",             nameEn: "Family",            icon: "heart",            color: "#F43F5E" },
  { key: "personal_borrow",  nameAr: "اقتراض شخصي",      nameEn: "Personal Borrowing", icon: "user",            color: "#A855F7" },
  { key: "external_borrow",  nameAr: "اقتراض خارجي",     nameEn: "External Borrowing", icon: "globe",           color: "#0EA5E9" },
];

export const COMPANY_SUBCATEGORIES: SubcategoryDef[] = [
  { key: "finance_company",  nameAr: "شركة تمويل",        nameEn: "Finance Company",   icon: "trending-up",      color: "#059669" },
  { key: "car_company",      nameAr: "شركة سيارات",       nameEn: "Car Company",       icon: "truck",            color: "#7C3AED" },
  { key: "service_company",  nameAr: "شركة خدمات",        nameEn: "Service Company",   icon: "tool",             color: "#0891B2" },
  { key: "supplier",         nameAr: "مورد",              nameEn: "Supplier",          icon: "package",          color: "#D97706" },
];

export const CATEGORY_SUBCATEGORIES: Record<DebtCategory, SubcategoryDef[]> = {
  bank:     BANK_SUBCATEGORIES,
  personal: PERSONAL_SUBCATEGORIES,
  company:  COMPANY_SUBCATEGORIES,
};

export function getSubcategoryDef(category: DebtCategory, key: string): SubcategoryDef | undefined {
  return CATEGORY_SUBCATEGORIES[category]?.find((s) => s.key === key);
}

export const CATEGORY_META: Record<DebtCategory, { icon: string; color: string; nameAr: string; nameEn: string }> = {
  bank:     { icon: "dollar-sign", color: "#3B82F6", nameAr: "دين بنكي",   nameEn: "Bank Debt" },
  personal: { icon: "users",       color: "#2F8F83", nameAr: "دين شخصي",   nameEn: "Personal Debt" },
  company:  { icon: "briefcase",   color: "#8B5CF6", nameAr: "دين شركة",   nameEn: "Company Debt" },
};
