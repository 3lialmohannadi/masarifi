import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  numeric,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const accountTypeEnum = pgEnum("account_type", [
  "current",
  "cash",
  "travel",
  "savings_bank",
  "wallet",
  "credit",
  "investment",
]);

export const categoryTypeEnum = pgEnum("category_type", [
  "income",
  "expense",
  "savings",
  "commitment",
  "plan",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const recurrenceTypeEnum = pgEnum("recurrence_type", [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const commitmentStatusEnum = pgEnum("commitment_status", [
  "upcoming",
  "due_today",
  "overdue",
  "paid",
]);

export const savingsWalletTypeEnum = pgEnum("savings_wallet_type", [
  "general_savings",
  "goal_savings",
]);

export const savingsMovementTypeEnum = pgEnum("savings_movement_type", [
  "deposit_internal",
  "deposit_external",
  "withdraw_internal",
  "withdraw_external",
]);

export const planTypeEnum = pgEnum("plan_type", [
  "travel",
  "wedding",
  "car",
  "house",
  "study",
  "business",
  "event",
  "medical",
  "other",
]);

export const languageEnum = pgEnum("language", ["ar", "en"]);
export const themeEnum = pgEnum("theme", ["light", "dark", "auto"]);
export const dailyLimitModeEnum = pgEnum("daily_limit_mode", [
  "smart",
  "manual",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

// 1. users
export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 2. settings
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  language: languageEnum("language").default("ar").notNull(),
  theme: themeEnum("theme").default("auto").notNull(),
  daily_limit_mode: dailyLimitModeEnum("daily_limit_mode")
    .default("smart")
    .notNull(),
  manual_daily_limit: numeric("manual_daily_limit", {
    precision: 15,
    scale: 3,
  }).default("0"),
  selected_account_id: varchar("selected_account_id", { length: 36 }),
  last_used_category_id: varchar("last_used_category_id", { length: 36 }),
  last_used_expense_category_id: varchar("last_used_expense_category_id", {
    length: 36,
  }),
  last_used_income_category_id: varchar("last_used_income_category_id", {
    length: 36,
  }),
  onboarded: boolean("onboarded").default(false).notNull(),
  notification_enabled: boolean("notification_enabled").default(true).notNull(),
  default_currency: varchar("default_currency", { length: 10 })
    .default("QAR")
    .notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 3. accounts
export const accounts = pgTable("accounts", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: numeric("balance", { precision: 15, scale: 3 })
    .default("0")
    .notNull(),
  currency: varchar("currency", { length: 10 }).default("QAR").notNull(),
  color: varchar("color", { length: 20 }).default("#10B981").notNull(),
  icon: varchar("icon", { length: 50 }).default("wallet").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 4. categories
export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  icon: varchar("icon", { length: 50 }).default("tag").notNull(),
  color: varchar("color", { length: 20 }).default("#6B7280").notNull(),
  type: categoryTypeEnum("type").notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  is_favorite: boolean("is_favorite").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 5. transactions
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  account_id: varchar("account_id", { length: 36 })
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  category_id: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("QAR").notNull(),
  date: timestamp("date").notNull(),
  note: text("note").default(""),
  linked_commitment_id: varchar("linked_commitment_id", { length: 36 }),
  linked_plan_id: varchar("linked_plan_id", { length: 36 }),
  linked_plan_category_id: varchar("linked_plan_category_id", { length: 36 }),
  linked_saving_wallet_id: varchar("linked_saving_wallet_id", { length: 36 }),
  linked_transfer_account_id: varchar("linked_transfer_account_id", {
    length: 36,
  }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 6. transfers
export const transfers = pgTable("transfers", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  source_account_id: varchar("source_account_id", { length: 36 })
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  destination_account_id: varchar("destination_account_id", { length: 36 })
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  source_amount: numeric("source_amount", {
    precision: 15,
    scale: 3,
  }).notNull(),
  destination_amount: numeric("destination_amount", {
    precision: 15,
    scale: 3,
  }).notNull(),
  exchange_rate: numeric("exchange_rate", { precision: 15, scale: 6 })
    .default("1")
    .notNull(),
  date: timestamp("date").notNull(),
  note: text("note").default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 7. savings_wallets
export const savingsWallets = pgTable("savings_wallets", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  description: text("description").default(""),
  type: savingsWalletTypeEnum("type").default("general_savings").notNull(),
  current_amount: numeric("current_amount", { precision: 15, scale: 3 })
    .default("0")
    .notNull(),
  target_amount: numeric("target_amount", { precision: 15, scale: 3 }),
  target_date: timestamp("target_date"),
  color: varchar("color", { length: 20 }).default("#10B981").notNull(),
  icon: varchar("icon", { length: 50 }).default("piggy-bank").notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  is_archived: boolean("is_archived").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 8. savings_transactions
export const savingsTransactions = pgTable("savings_transactions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  wallet_id: varchar("wallet_id", { length: 36 })
    .notNull()
    .references(() => savingsWallets.id, { onDelete: "cascade" }),
  account_id: varchar("account_id", { length: 36 }).references(
    () => accounts.id,
    { onDelete: "set null" }
  ),
  type: savingsMovementTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  date: timestamp("date").notNull(),
  note: text("note").default(""),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 9. plans
export const plans = pgTable("plans", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  plan_type: planTypeEnum("plan_type").default("other").notNull(),
  description: text("description").default(""),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  total_budget: numeric("total_budget", { precision: 15, scale: 3 })
    .default("0")
    .notNull(),
  currency: varchar("currency", { length: 10 }).default("QAR").notNull(),
  color: varchar("color", { length: 20 }).default("#10B981").notNull(),
  icon: varchar("icon", { length: 50 }).default("map").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 10. plan_categories
export const planCategories = pgTable("plan_categories", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  plan_id: varchar("plan_id", { length: 36 })
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  budget_amount: numeric("budget_amount", {
    precision: 15,
    scale: 3,
  }).notNull(),
  color: varchar("color", { length: 20 }).default("#6B7280").notNull(),
  icon: varchar("icon", { length: 50 }).default("tag").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 11. commitments
export const commitments = pgTable("commitments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  account_id: varchar("account_id", { length: 36 })
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  category_id: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  due_date: timestamp("due_date").notNull(),
  recurrence_type: recurrenceTypeEnum("recurrence_type")
    .default("monthly")
    .notNull(),
  status: commitmentStatusEnum("status").default("upcoming").notNull(),
  is_manual: boolean("is_manual").default(false).notNull(),
  paid_at: timestamp("paid_at"),
  note: text("note").default(""),
  parent_commitment_id: varchar("parent_commitment_id", { length: 36 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// 12. budgets
export const budgets = pgTable("budgets", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade",
  }),
  category_id: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(settings, {
    fields: [users.id],
    references: [settings.user_id],
  }),
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  transfers: many(transfers),
  savingsWallets: many(savingsWallets),
  savingsTransactions: many(savingsTransactions),
  plans: many(plans),
  commitments: many(commitments),
  budgets: many(budgets),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.user_id],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.user_id],
    references: [users.id],
  }),
  transactions: many(transactions),
  sourceTransfers: many(transfers, { relationName: "source" }),
  destinationTransfers: many(transfers, { relationName: "destination" }),
  commitments: many(commitments),
  savingsTransactions: many(savingsTransactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.user_id],
    references: [users.id],
  }),
  transactions: many(transactions),
  commitments: many(commitments),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.user_id],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.account_id],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.category_id],
    references: [categories.id],
  }),
  linkedCommitment: one(commitments, {
    fields: [transactions.linked_commitment_id],
    references: [commitments.id],
  }),
  linkedPlan: one(plans, {
    fields: [transactions.linked_plan_id],
    references: [plans.id],
  }),
  linkedPlanCategory: one(planCategories, {
    fields: [transactions.linked_plan_category_id],
    references: [planCategories.id],
  }),
  linkedSavingWallet: one(savingsWallets, {
    fields: [transactions.linked_saving_wallet_id],
    references: [savingsWallets.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  user: one(users, {
    fields: [transfers.user_id],
    references: [users.id],
  }),
  sourceAccount: one(accounts, {
    fields: [transfers.source_account_id],
    references: [accounts.id],
    relationName: "source",
  }),
  destinationAccount: one(accounts, {
    fields: [transfers.destination_account_id],
    references: [accounts.id],
    relationName: "destination",
  }),
}));

export const savingsWalletsRelations = relations(
  savingsWallets,
  ({ one, many }) => ({
    user: one(users, {
      fields: [savingsWallets.user_id],
      references: [users.id],
    }),
    savingsTransactions: many(savingsTransactions),
    linkedTransactions: many(transactions),
  })
);

export const savingsTransactionsRelations = relations(
  savingsTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [savingsTransactions.user_id],
      references: [users.id],
    }),
    wallet: one(savingsWallets, {
      fields: [savingsTransactions.wallet_id],
      references: [savingsWallets.id],
    }),
    account: one(accounts, {
      fields: [savingsTransactions.account_id],
      references: [accounts.id],
    }),
  })
);

export const plansRelations = relations(plans, ({ one, many }) => ({
  user: one(users, {
    fields: [plans.user_id],
    references: [users.id],
  }),
  planCategories: many(planCategories),
  linkedTransactions: many(transactions),
}));

export const planCategoriesRelations = relations(planCategories, ({ one, many }) => ({
  plan: one(plans, {
    fields: [planCategories.plan_id],
    references: [plans.id],
  }),
  linkedTransactions: many(transactions),
}));

export const commitmentsRelations = relations(commitments, ({ one, many }) => ({
  user: one(users, {
    fields: [commitments.user_id],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [commitments.account_id],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [commitments.category_id],
    references: [categories.id],
  }),
  linkedTransactions: many(transactions),
  childCommitments: many(commitments, { relationName: "parent" }),
  parentCommitment: one(commitments, {
    fields: [commitments.parent_commitment_id],
    references: [commitments.id],
    relationName: "parent",
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.user_id],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [budgets.category_id],
    references: [categories.id],
  }),
}));

// ─── Zod Schemas (Insert) ─────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  created_at: true,
});

export const insertSavingsWalletSchema = createInsertSchema(savingsWallets).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSavingsTransactionSchema = createInsertSchema(
  savingsTransactions
).omit({ id: true, created_at: true });

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPlanCategorySchema = createInsertSchema(planCategories).omit(
  { id: true, created_at: true }
);

export const insertCommitmentSchema = createInsertSchema(commitments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateSettingsSchema = createInsertSchema(settings).partial().omit({
  id: true,
  updated_at: true,
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;

export type SavingsWallet = typeof savingsWallets.$inferSelect;
export type InsertSavingsWallet = z.infer<typeof insertSavingsWalletSchema>;

export type SavingsTransaction = typeof savingsTransactions.$inferSelect;
export type InsertSavingsTransaction = z.infer<
  typeof insertSavingsTransactionSchema
>;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type PlanCategory = typeof planCategories.$inferSelect;
export type InsertPlanCategory = z.infer<typeof insertPlanCategorySchema>;

export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Settings = typeof settings.$inferSelect;
