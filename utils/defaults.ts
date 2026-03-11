import type { SavingsWallet } from "@/types";
import { now } from "./id";

export function createDefaultSavingsWallet(): SavingsWallet {
  return {
    id: "general-savings-default",
    name_ar: "التوفير العام",
    name_en: "General Savings",
    description: "",
    type: "general_savings",
    current_amount: 0,
    color: "#3B82F6",
    icon: "piggy-bank",
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
