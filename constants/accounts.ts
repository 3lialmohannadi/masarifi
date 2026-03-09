import type { AccountType } from "@/types";

export const ACCOUNT_TYPES: { type: AccountType; icon: string; color: string; nameAr: string; nameEn: string }[] = [
  { type: "current",      icon: "credit-card",  color: "#3B82F6", nameAr: "حساب جاري",      nameEn: "Current Account" },
  { type: "cash",         icon: "dollar-sign",  color: "#22C55E", nameAr: "نقدي",             nameEn: "Cash" },
  { type: "savings_bank", icon: "database",     color: "#8B5CF6", nameAr: "توفير بنكي",       nameEn: "Bank Savings" },
  { type: "wallet",       icon: "smartphone",   color: "#06B6D4", nameAr: "محفظة رقمية",      nameEn: "Digital Wallet" },
  { type: "travel",       icon: "map",          color: "#F59E0B", nameAr: "سفر",              nameEn: "Travel" },
  { type: "credit",       icon: "alert-circle", color: "#EF4444", nameAr: "بطاقة ائتمان",    nameEn: "Credit Card" },
  { type: "investment",   icon: "trending-up",  color: "#10B981", nameAr: "استثمار",          nameEn: "Investment" },
];

export function getAccountTypeInfo(type: AccountType) {
  return ACCOUNT_TYPES.find((a) => a.type === type) || ACCOUNT_TYPES[0];
}
