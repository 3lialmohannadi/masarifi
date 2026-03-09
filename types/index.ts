export type Language = "ar" | "en";
export type ThemeMode = "light" | "dark" | "auto";
export type DailyLimitMode = "smart" | "manual";

export type AccountType =
  | "current"
  | "cash"
  | "travel"
  | "savings_bank"
  | "wallet"
  | "credit"
  | "investment";

export type TransactionType = "income" | "expense";

export type CategoryType =
  | "income"
  | "expense"
  | "savings"
  | "commitment"
  | "plan";

export type CommitmentStatus =
  | "upcoming"
  | "due_today"
  | "overdue"
  | "paid";

export type RecurrenceType =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export type SavingsWalletType = "general_savings" | "goal_savings";

export type SavingsMovementType =
  | "deposit_internal"
  | "deposit_external"
  | "withdraw_internal"
  | "withdraw_external";

export type PlanType =
  | "travel"
  | "wedding"
  | "car"
  | "house"
  | "study"
  | "business"
  | "event"
  | "medical"
  | "other";

export interface Account {
  id: string;
  name_ar: string;
  name_en: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: boolean;
  is_active: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  note: string;
  linked_commitment_id?: string;
  linked_plan_id?: string;
  linked_plan_category_id?: string;
  linked_saving_wallet_id?: string;
  linked_transfer_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  source_amount: number;
  destination_amount: number;
  exchange_rate: number;
  date: string;
  note: string;
  created_at: string;
}

export interface SavingsWallet {
  id: string;
  name_ar: string;
  name_en: string;
  description: string;
  type: SavingsWalletType;
  current_amount: number;
  target_amount?: number;
  target_date?: string;
  color: string;
  icon: string;
  is_default: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  wallet_id: string;
  type: SavingsMovementType;
  amount: number;
  account_id?: string;
  date: string;
  note: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name_ar: string;
  name_en: string;
  plan_type: PlanType;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface PlanCategory {
  id: string;
  plan_id: string;
  name_ar: string;
  name_en: string;
  budget_amount: number;
  color: string;
  icon: string;
  created_at: string;
}

export interface Commitment {
  id: string;
  name_ar: string;
  name_en: string;
  amount: number;
  account_id: string;
  category_id: string;
  due_date: string;
  recurrence_type: RecurrenceType;
  status: CommitmentStatus;
  is_manual: boolean;
  paid_at?: string;
  note: string;
  parent_commitment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  language: Language;
  theme: ThemeMode;
  daily_limit_mode: DailyLimitMode;
  manual_daily_limit: number;
  selected_account_id: string;
  last_used_category_id: string;
  last_used_expense_category_id: string;
  last_used_income_category_id: string;
  onboarded: boolean;
  notification_enabled: boolean;
  default_currency: string;
}
