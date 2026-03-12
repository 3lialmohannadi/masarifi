var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/storage.ts
import { eq, desc, asc, and } from "drizzle-orm";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// database/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accountTypeEnum: () => accountTypeEnum,
  accounts: () => accounts,
  accountsRelations: () => accountsRelations,
  budgets: () => budgets,
  budgetsRelations: () => budgetsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  categoryTypeEnum: () => categoryTypeEnum,
  commitmentStatusEnum: () => commitmentStatusEnum,
  commitments: () => commitments,
  commitmentsRelations: () => commitmentsRelations,
  dailyLimitModeEnum: () => dailyLimitModeEnum,
  insertAccountSchema: () => insertAccountSchema,
  insertBudgetSchema: () => insertBudgetSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertCommitmentSchema: () => insertCommitmentSchema,
  insertPlanCategorySchema: () => insertPlanCategorySchema,
  insertPlanSchema: () => insertPlanSchema,
  insertSavingsTransactionSchema: () => insertSavingsTransactionSchema,
  insertSavingsWalletSchema: () => insertSavingsWalletSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertTransferSchema: () => insertTransferSchema,
  languageEnum: () => languageEnum,
  planCategories: () => planCategories,
  planCategoriesRelations: () => planCategoriesRelations,
  planTypeEnum: () => planTypeEnum,
  plans: () => plans,
  plansRelations: () => plansRelations,
  recurrenceTypeEnum: () => recurrenceTypeEnum,
  savingsMovementTypeEnum: () => savingsMovementTypeEnum,
  savingsTransactions: () => savingsTransactions,
  savingsTransactionsRelations: () => savingsTransactionsRelations,
  savingsWalletTypeEnum: () => savingsWalletTypeEnum,
  savingsWallets: () => savingsWallets,
  savingsWalletsRelations: () => savingsWalletsRelations,
  settings: () => settings,
  themeEnum: () => themeEnum,
  transactionTypeEnum: () => transactionTypeEnum,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  transfers: () => transfers,
  transfersRelations: () => transfersRelations,
  updateSettingsSchema: () => updateSettingsSchema,
  users: () => users
});
import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  numeric,
  boolean,
  integer,
  timestamp,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var accountTypeEnum = pgEnum("account_type", [
  "current",
  "cash",
  "travel",
  "savings_bank",
  "wallet",
  "credit",
  "investment"
]);
var categoryTypeEnum = pgEnum("category_type", [
  "income",
  "expense",
  "savings",
  "commitment",
  "plan",
  "general"
]);
var transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense"
]);
var recurrenceTypeEnum = pgEnum("recurrence_type", [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly"
]);
var commitmentStatusEnum = pgEnum("commitment_status", [
  "upcoming",
  "due_today",
  "overdue",
  "paid"
]);
var savingsWalletTypeEnum = pgEnum("savings_wallet_type", [
  "general_savings",
  "goal_savings"
]);
var savingsMovementTypeEnum = pgEnum("savings_movement_type", [
  "deposit_internal",
  "deposit_external",
  "withdraw_internal",
  "withdraw_external"
]);
var planTypeEnum = pgEnum("plan_type", [
  "travel",
  "wedding",
  "car",
  "house",
  "study",
  "business",
  "event",
  "medical",
  "other"
]);
var languageEnum = pgEnum("language", ["ar", "en"]);
var themeEnum = pgEnum("theme", ["light", "dark", "auto"]);
var dailyLimitModeEnum = pgEnum("daily_limit_mode", [
  "smart",
  "manual"
]);
var users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // DB legacy column (NOT NULL), unused
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  language: languageEnum("language").default("ar").notNull(),
  theme: themeEnum("theme").default("auto").notNull(),
  daily_limit_mode: dailyLimitModeEnum("daily_limit_mode").default("smart").notNull(),
  manual_daily_limit: numeric("manual_daily_limit", {
    precision: 15,
    scale: 3
  }).default("0"),
  selected_account_id: varchar("selected_account_id", { length: 36 }),
  last_used_category_id: varchar("last_used_category_id", { length: 36 }),
  last_used_expense_category_id: varchar("last_used_expense_category_id", {
    length: 36
  }),
  last_used_income_category_id: varchar("last_used_income_category_id", {
    length: 36
  }),
  onboarded: boolean("onboarded").default(false).notNull(),
  notification_enabled: boolean("notification_enabled").default(true).notNull(),
  default_currency: varchar("default_currency", { length: 10 }).default("QAR").notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var accounts = pgTable("accounts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: numeric("balance", { precision: 15, scale: 3 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("QAR").notNull(),
  color: varchar("color", { length: 20 }).default("#10B981").notNull(),
  icon: varchar("icon", { length: 50 }).default("wallet").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var categories = pgTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
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
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  account_id: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
  category_id: varchar("category_id", { length: 36 }).references(
    () => categories.id,
    { onDelete: "set null" }
  ),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("QAR").notNull(),
  date: timestamp("date").notNull(),
  note: text("note").default(""),
  linked_commitment_id: varchar("linked_commitment_id", { length: 36 }).references(
    () => commitments.id,
    { onDelete: "set null" }
  ),
  linked_plan_id: varchar("linked_plan_id", { length: 36 }).references(
    () => plans.id,
    { onDelete: "set null" }
  ),
  linked_plan_category_id: varchar("linked_plan_category_id", { length: 36 }).references(
    () => planCategories.id,
    { onDelete: "set null" }
  ),
  linked_saving_wallet_id: varchar("linked_saving_wallet_id", { length: 36 }).references(
    () => savingsWallets.id,
    { onDelete: "set null" }
  ),
  linked_transfer_account_id: varchar("linked_transfer_account_id", {
    length: 36
  }).references(() => accounts.id, { onDelete: "set null" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var transfers = pgTable("transfers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  source_account_id: varchar("source_account_id", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
  destination_account_id: varchar("destination_account_id", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "cascade" }),
  source_amount: numeric("source_amount", {
    precision: 15,
    scale: 3
  }).notNull(),
  destination_amount: numeric("destination_amount", {
    precision: 15,
    scale: 3
  }).notNull(),
  exchange_rate: numeric("exchange_rate", { precision: 15, scale: 6 }).default("1").notNull(),
  date: timestamp("date").notNull(),
  note: text("note").default(""),
  created_at: timestamp("created_at").defaultNow().notNull()
});
var savingsWallets = pgTable("savings_wallets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  description: text("description").default(""),
  type: savingsWalletTypeEnum("type").default("general_savings").notNull(),
  current_amount: numeric("current_amount", { precision: 15, scale: 3 }).default("0").notNull(),
  target_amount: numeric("target_amount", { precision: 15, scale: 3 }),
  target_date: timestamp("target_date"),
  color: varchar("color", { length: 20 }).default("#10B981").notNull(),
  icon: varchar("icon", { length: 50 }).default("piggy-bank").notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  is_archived: boolean("is_archived").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var savingsTransactions = pgTable("savings_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  wallet_id: varchar("wallet_id", { length: 36 }).notNull().references(() => savingsWallets.id, { onDelete: "cascade" }),
  account_id: varchar("account_id", { length: 36 }).references(
    () => accounts.id,
    { onDelete: "set null" }
  ),
  type: savingsMovementTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  date: timestamp("date").notNull(),
  note: text("note").default(""),
  created_at: timestamp("created_at").defaultNow().notNull()
});
var plans = pgTable("plans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  plan_type: planTypeEnum("plan_type").default("other").notNull(),
  description: text("description").default(""),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  total_budget: numeric("total_budget", { precision: 15, scale: 3 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("QAR").notNull(),
  color: varchar("color", { length: 20 }).default("#10B981").notNull(),
  icon: varchar("icon", { length: 50 }).default("map").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var planCategories = pgTable("plan_categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  plan_id: varchar("plan_id", { length: 36 }).notNull().references(() => plans.id, { onDelete: "cascade" }),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  budget_amount: numeric("budget_amount", {
    precision: 15,
    scale: 3
  }).notNull(),
  color: varchar("color", { length: 20 }).default("#6B7280").notNull(),
  icon: varchar("icon", { length: 50 }).default("tag").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});
var commitments = pgTable("commitments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  account_id: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id, { onDelete: "restrict" }),
  category_id: varchar("category_id", { length: 36 }).references(
    () => categories.id,
    { onDelete: "set null" }
  ),
  name_ar: text("name_ar").notNull(),
  name_en: text("name_en").notNull(),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  due_date: timestamp("due_date").notNull(),
  recurrence_type: recurrenceTypeEnum("recurrence_type").default("monthly").notNull(),
  status: commitmentStatusEnum("status").default("upcoming").notNull(),
  is_manual: boolean("is_manual").default(false).notNull(),
  paid_at: timestamp("paid_at"),
  note: text("note").default(""),
  parent_commitment_id: varchar("parent_commitment_id", { length: 36 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var budgets = pgTable("budgets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id", { length: 36 }).references(() => users.id, {
    onDelete: "cascade"
  }),
  category_id: varchar("category_id", { length: 36 }).references(
    () => categories.id,
    { onDelete: "set null" }
  ),
  amount: numeric("amount", { precision: 15, scale: 3 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
var accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  sourceTransfers: many(transfers, { relationName: "source" }),
  destinationTransfers: many(transfers, { relationName: "destination" }),
  commitments: many(commitments),
  savingsTransactions: many(savingsTransactions)
}));
var categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  commitments: many(commitments),
  budgets: many(budgets)
}));
var transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.account_id],
    references: [accounts.id]
  }),
  category: one(categories, {
    fields: [transactions.category_id],
    references: [categories.id]
  }),
  linkedCommitment: one(commitments, {
    fields: [transactions.linked_commitment_id],
    references: [commitments.id]
  }),
  linkedPlan: one(plans, {
    fields: [transactions.linked_plan_id],
    references: [plans.id]
  }),
  linkedPlanCategory: one(planCategories, {
    fields: [transactions.linked_plan_category_id],
    references: [planCategories.id]
  }),
  linkedSavingWallet: one(savingsWallets, {
    fields: [transactions.linked_saving_wallet_id],
    references: [savingsWallets.id]
  })
}));
var transfersRelations = relations(transfers, ({ one }) => ({
  sourceAccount: one(accounts, {
    fields: [transfers.source_account_id],
    references: [accounts.id],
    relationName: "source"
  }),
  destinationAccount: one(accounts, {
    fields: [transfers.destination_account_id],
    references: [accounts.id],
    relationName: "destination"
  })
}));
var savingsWalletsRelations = relations(
  savingsWallets,
  ({ many }) => ({
    savingsTransactions: many(savingsTransactions),
    linkedTransactions: many(transactions)
  })
);
var savingsTransactionsRelations = relations(
  savingsTransactions,
  ({ one }) => ({
    wallet: one(savingsWallets, {
      fields: [savingsTransactions.wallet_id],
      references: [savingsWallets.id]
    }),
    account: one(accounts, {
      fields: [savingsTransactions.account_id],
      references: [accounts.id]
    })
  })
);
var plansRelations = relations(plans, ({ many }) => ({
  planCategories: many(planCategories),
  linkedTransactions: many(transactions)
}));
var planCategoriesRelations = relations(planCategories, ({ one, many }) => ({
  plan: one(plans, {
    fields: [planCategories.plan_id],
    references: [plans.id]
  }),
  linkedTransactions: many(transactions)
}));
var commitmentsRelations = relations(commitments, ({ one, many }) => ({
  account: one(accounts, {
    fields: [commitments.account_id],
    references: [accounts.id]
  }),
  category: one(categories, {
    fields: [commitments.category_id],
    references: [categories.id]
  }),
  linkedTransactions: many(transactions),
  childCommitments: many(commitments, { relationName: "parent" }),
  parentCommitment: one(commitments, {
    fields: [commitments.parent_commitment_id],
    references: [commitments.id],
    relationName: "parent"
  })
}));
var budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.category_id],
    references: [categories.id]
  })
}));
var insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  created_at: true
});
var insertSavingsWalletSchema = createInsertSchema(savingsWallets).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertSavingsTransactionSchema = createInsertSchema(
  savingsTransactions
).omit({ id: true, created_at: true });
var insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertPlanCategorySchema = createInsertSchema(planCategories).omit(
  { id: true, created_at: true }
);
var insertCommitmentSchema = createInsertSchema(commitments).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var updateSettingsSchema = createInsertSchema(settings).partial().omit({
  id: true,
  updated_at: true
});

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
var DatabaseStorage = class {
  // ── Settings ───────────────────────────────────────────────────────────────
  async getSettings(userId) {
    if (userId) {
      const [row2] = await db.select().from(settings).where(eq(settings.user_id, userId));
      return row2;
    }
    const [row] = await db.select().from(settings).where(eq(settings.id, 1));
    return row;
  }
  async upsertSettings(data) {
    const existing = await this.getSettings(data.user_id ?? void 0);
    if (existing) {
      const [updated] = await db.update(settings).set({ ...data, updated_at: /* @__PURE__ */ new Date() }).where(eq(settings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(settings).values(data).returning();
    return created;
  }
  // ── Accounts ───────────────────────────────────────────────────────────────
  async getAccounts(userId) {
    if (userId) {
      return db.select().from(accounts).where(eq(accounts.user_id, userId)).orderBy(asc(accounts.created_at));
    }
    return db.select().from(accounts).orderBy(asc(accounts.created_at));
  }
  async getAccount(id) {
    const [row] = await db.select().from(accounts).where(eq(accounts.id, id));
    return row;
  }
  async createAccount(data) {
    const [row] = await db.insert(accounts).values(data).returning();
    return row;
  }
  async updateAccount(id, data) {
    const [row] = await db.update(accounts).set({ ...data, updated_at: /* @__PURE__ */ new Date() }).where(eq(accounts.id, id)).returning();
    return row;
  }
  async deleteAccount(id) {
    await db.delete(accounts).where(eq(accounts.id, id));
  }
  // ── Categories ─────────────────────────────────────────────────────────────
  async getCategories(userId) {
    if (userId) {
      return db.select().from(categories).where(eq(categories.user_id, userId)).orderBy(asc(categories.created_at));
    }
    return db.select().from(categories).orderBy(asc(categories.created_at));
  }
  async getCategory(id) {
    const [row] = await db.select().from(categories).where(eq(categories.id, id));
    return row;
  }
  async createCategory(data) {
    const [row] = await db.insert(categories).values(data).returning();
    return row;
  }
  async updateCategory(id, data) {
    const [row] = await db.update(categories).set({ ...data, updated_at: /* @__PURE__ */ new Date() }).where(eq(categories.id, id)).returning();
    return row;
  }
  async deleteCategory(id) {
    await db.delete(categories).where(eq(categories.id, id));
  }
  // ── Transactions ───────────────────────────────────────────────────────────
  async getTransactions(userId) {
    if (userId) {
      return db.select().from(transactions).where(eq(transactions.user_id, userId)).orderBy(desc(transactions.date));
    }
    return db.select().from(transactions).orderBy(desc(transactions.date));
  }
  async getTransaction(id) {
    const [row] = await db.select().from(transactions).where(eq(transactions.id, id));
    return row;
  }
  async createTransaction(data) {
    const [row] = await db.insert(transactions).values(data).returning();
    return row;
  }
  async updateTransaction(id, data) {
    const [row] = await db.update(transactions).set({ ...data, updated_at: /* @__PURE__ */ new Date() }).where(eq(transactions.id, id)).returning();
    return row;
  }
  async deleteTransaction(id) {
    await db.delete(transactions).where(eq(transactions.id, id));
  }
  // ── Transfers ──────────────────────────────────────────────────────────────
  async getTransfers(userId) {
    if (userId) {
      return db.select().from(transfers).where(eq(transfers.user_id, userId)).orderBy(desc(transfers.date));
    }
    return db.select().from(transfers).orderBy(desc(transfers.date));
  }
  async getTransfer(id) {
    const [row] = await db.select().from(transfers).where(eq(transfers.id, id));
    return row;
  }
  async createTransfer(data) {
    const [row] = await db.insert(transfers).values(data).returning();
    return row;
  }
  async updateTransfer(id, data) {
    const [row] = await db.update(transfers).set(data).where(eq(transfers.id, id)).returning();
    return row;
  }
  async deleteTransfer(id) {
    await db.delete(transfers).where(eq(transfers.id, id));
  }
  // ── Savings Wallets ────────────────────────────────────────────────────────
  async getSavingsWallets(userId) {
    if (userId) {
      return db.select().from(savingsWallets).where(eq(savingsWallets.user_id, userId)).orderBy(asc(savingsWallets.created_at));
    }
    return db.select().from(savingsWallets).orderBy(asc(savingsWallets.created_at));
  }
  async getSavingsWallet(id) {
    const [row] = await db.select().from(savingsWallets).where(eq(savingsWallets.id, id));
    return row;
  }
  async createSavingsWallet(data) {
    const [row] = await db.insert(savingsWallets).values(data).returning();
    return row;
  }
  async updateSavingsWallet(id, data) {
    const [row] = await db.update(savingsWallets).set({ ...data, updated_at: /* @__PURE__ */ new Date() }).where(eq(savingsWallets.id, id)).returning();
    return row;
  }
  async deleteSavingsWallet(id) {
    await db.delete(savingsWallets).where(eq(savingsWallets.id, id));
  }
  // ── Savings Transactions ───────────────────────────────────────────────────
  async getSavingsTransactions(walletId, userId) {
    const conditions = [];
    if (walletId) conditions.push(eq(savingsTransactions.wallet_id, walletId));
    if (userId) conditions.push(eq(savingsTransactions.user_id, userId));
    const query = db.select().from(savingsTransactions);
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(savingsTransactions.date));
    }
    return query.orderBy(desc(savingsTransactions.date));
  }
  async getSavingsTransaction(id) {
    const [row] = await db.select().from(savingsTransactions).where(eq(savingsTransactions.id, id));
    return row;
  }
  async createSavingsTransaction(data) {
    const [row] = await db.insert(savingsTransactions).values(data).returning();
    return row;
  }
  async updateSavingsTransaction(id, data) {
    const [row] = await db.update(savingsTransactions).set(data).where(eq(savingsTransactions.id, id)).returning();
    return row;
  }
  async deleteSavingsTransaction(id) {
    await db.delete(savingsTransactions).where(eq(savingsTransactions.id, id));
  }
  // ── Commitments ────────────────────────────────────────────────────────────
  async getCommitments(userId) {
    if (userId) {
      return db.select().from(commitments).where(eq(commitments.user_id, userId)).orderBy(asc(commitments.due_date));
    }
    return db.select().from(commitments).orderBy(asc(commitments.due_date));
  }
  async getCommitment(id) {
    const [row] = await db.select().from(commitments).where(eq(commitments.id, id));
    return row;
  }
  async createCommitment(data) {
    const [row] = await db.insert(commitments).values(data).returning();
    return row;
  }
  async updateCommitment(id, data) {
    const [row] = await db.update(commitments).set({ ...data, updated_at: /* @__PURE__ */ new Date() }).where(eq(commitments.id, id)).returning();
    return row;
  }
  async deleteCommitment(id) {
    await db.delete(commitments).where(eq(commitments.id, id));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { eq as eq2, and as and2 } from "drizzle-orm";
import { z, ZodError } from "zod";

// server/api-docs.ts
var apiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Masarifi API",
    description: "Personal finance management API with bilingual (Arabic/English) support",
    version: "1.0.0"
  },
  servers: [
    { url: "/api", description: "API base" }
  ],
  components: {
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" }
              }
            }
          }
        }
      },
      Account: {
        type: "object",
        properties: {
          id: { type: "string" },
          user_id: { type: "string" },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          type: { type: "string", enum: ["current", "cash", "travel", "savings_bank", "wallet", "credit", "investment"] },
          balance: { type: "number" },
          currency: { type: "string" },
          color: { type: "string" },
          icon: { type: "string" },
          is_active: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          icon: { type: "string" },
          color: { type: "string" },
          type: { type: "string", enum: ["income", "expense", "savings", "commitment", "plan", "general"] },
          is_default: { type: "boolean" },
          is_active: { type: "boolean" },
          is_favorite: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          account_id: { type: "string" },
          category_id: { type: "string", nullable: true },
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number" },
          currency: { type: "string" },
          date: { type: "string", format: "date-time" },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      Transfer: {
        type: "object",
        properties: {
          id: { type: "string" },
          source_account_id: { type: "string" },
          destination_account_id: { type: "string" },
          source_amount: { type: "number" },
          destination_amount: { type: "number" },
          exchange_rate: { type: "number" },
          date: { type: "string", format: "date-time" },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      SavingsWallet: {
        type: "object",
        properties: {
          id: { type: "string" },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["general_savings", "goal_savings"] },
          current_amount: { type: "number" },
          target_amount: { type: "number", nullable: true },
          target_date: { type: "string", format: "date-time", nullable: true },
          color: { type: "string" },
          icon: { type: "string" },
          is_default: { type: "boolean" },
          is_archived: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      SavingsTransaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          wallet_id: { type: "string" },
          account_id: { type: "string", nullable: true },
          type: { type: "string", enum: ["deposit_internal", "deposit_external", "withdraw_internal", "withdraw_external"] },
          amount: { type: "number" },
          date: { type: "string", format: "date-time" },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Commitment: {
        type: "object",
        properties: {
          id: { type: "string" },
          account_id: { type: "string" },
          category_id: { type: "string", nullable: true },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          amount: { type: "number" },
          due_date: { type: "string", format: "date-time" },
          recurrence_type: { type: "string", enum: ["none", "daily", "weekly", "monthly", "yearly"] },
          status: { type: "string", enum: ["upcoming", "due_today", "overdue", "paid"] },
          is_manual: { type: "boolean" },
          paid_at: { type: "string", format: "date-time", nullable: true },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      }
    }
  },
  paths: {
    "/accounts": {
      get: {
        tags: ["Accounts"],
        summary: "List all accounts",
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Account" } } } } } }
      },
      post: {
        tags: ["Accounts"],
        summary: "Create an account",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } },
        responses: { "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } }, "400": { description: "Validation error" } }
      }
    },
    "/accounts/{id}": {
      patch: { tags: ["Accounts"], summary: "Update an account", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } },
      delete: { tags: ["Accounts"], summary: "Soft-delete an account", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "404": { description: "Not found" }, "409": { description: "Has linked commitments" } } }
    },
    "/categories": {
      get: { tags: ["Categories"], summary: "List all categories", responses: { "200": { description: "OK" } } },
      post: { tags: ["Categories"], summary: "Create a category", responses: { "200": { description: "Created" }, "400": { description: "Validation error" } } }
    },
    "/categories/{id}": {
      patch: { tags: ["Categories"], summary: "Update a category", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } },
      delete: { tags: ["Categories"], summary: "Delete a category", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "409": { description: "In use by transactions" } } }
    },
    "/transactions": {
      get: { tags: ["Transactions"], summary: "List all transactions", responses: { "200": { description: "OK" } } },
      post: { tags: ["Transactions"], summary: "Create a transaction", responses: { "200": { description: "Created" }, "400": { description: "Validation error / amount must be > 0" } } }
    },
    "/transactions/{id}": {
      patch: { tags: ["Transactions"], summary: "Update a transaction", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } },
      delete: { tags: ["Transactions"], summary: "Delete a transaction", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "404": { description: "Not found" } } }
    },
    "/transfers": {
      get: { tags: ["Transfers"], summary: "List all transfers", responses: { "200": { description: "OK" } } },
      post: { tags: ["Transfers"], summary: "Create a transfer", responses: { "200": { description: "Created" }, "400": { description: "Validation error" } } }
    },
    "/transfers/{id}": {
      delete: { tags: ["Transfers"], summary: "Delete a transfer", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "404": { description: "Not found" } } }
    },
    "/savings-wallets": {
      get: { tags: ["Savings"], summary: "List savings wallets", responses: { "200": { description: "OK" } } },
      post: { tags: ["Savings"], summary: "Create a savings wallet", responses: { "200": { description: "Created" } } }
    },
    "/savings-wallets/{id}": {
      patch: { tags: ["Savings"], summary: "Update a savings wallet", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Savings"], summary: "Delete a savings wallet", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } }
    },
    "/savings-transactions": {
      get: { tags: ["Savings"], summary: "List savings transactions", parameters: [{ name: "walletId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      post: { tags: ["Savings"], summary: "Create a savings transaction", responses: { "200": { description: "Created" } } }
    },
    "/savings-transactions/{id}": {
      delete: { tags: ["Savings"], summary: "Delete a savings transaction", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } }
    },
    "/commitments": {
      get: { tags: ["Commitments"], summary: "List all commitments", responses: { "200": { description: "OK" } } },
      post: { tags: ["Commitments"], summary: "Create a commitment", responses: { "200": { description: "Created" } } }
    },
    "/commitments/{id}": {
      patch: { tags: ["Commitments"], summary: "Update a commitment", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Commitments"], summary: "Delete a commitment", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } }
    },
    "/reset": {
      post: {
        tags: ["Admin"],
        summary: "Reset all user data",
        description: "Deletes all accounts, transactions, transfers, savings, and commitments. Requires X-Confirm-Reset: true header.",
        parameters: [{ name: "X-Confirm-Reset", in: "header", required: true, schema: { type: "string", enum: ["true"] } }],
        responses: { "200": { description: "Data reset" }, "400": { description: "Missing confirmation header" } }
      }
    }
  }
};

// server/routes.ts
var DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
function paramId(req) {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}
function errMsg(e) {
  if (e instanceof ZodError) {
    return e.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ");
  }
  return e instanceof Error ? e.message : String(e);
}
function toNumber(value, fallback = 0) {
  if (value == null) return fallback;
  if (typeof value === "number") return isNaN(value) ? fallback : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}
function toIso(d) {
  if (!d) return (/* @__PURE__ */ new Date()).toISOString();
  if (d instanceof Date) return d.toISOString();
  return d;
}
function toIsoOrNull(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return d;
}
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d;
}
function normAccount(a) {
  return {
    ...a,
    balance: toNumber(a.balance),
    created_at: toIso(a.created_at),
    updated_at: toIso(a.updated_at)
  };
}
function normTransaction(t) {
  return {
    ...t,
    amount: toNumber(t.amount),
    date: toIso(t.date),
    created_at: toIso(t.created_at),
    updated_at: toIso(t.updated_at)
  };
}
function normTransfer(t) {
  return {
    ...t,
    source_amount: toNumber(t.source_amount),
    destination_amount: toNumber(t.destination_amount),
    exchange_rate: toNumber(t.exchange_rate, 1),
    date: toIso(t.date),
    created_at: toIso(t.created_at)
  };
}
function normSavingsWallet(w) {
  return {
    ...w,
    current_amount: toNumber(w.current_amount),
    target_amount: w.target_amount != null ? toNumber(w.target_amount) : void 0,
    target_date: toIsoOrNull(w.target_date),
    created_at: toIso(w.created_at),
    updated_at: toIso(w.updated_at)
  };
}
function normSavingsTx(t) {
  return {
    ...t,
    amount: toNumber(t.amount),
    date: toIso(t.date),
    created_at: toIso(t.created_at)
  };
}
function normCommitment(c) {
  return {
    ...c,
    amount: toNumber(c.amount),
    due_date: toIso(c.due_date),
    paid_at: toIsoOrNull(c.paid_at),
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at)
  };
}
function normCategory(c) {
  return {
    ...c,
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at)
  };
}
var createAccountSchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().min(1, "English name is required"),
  type: z.enum(["current", "cash", "travel", "savings_bank", "wallet", "credit", "investment"]),
  balance: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().default("0"),
  currency: z.string().min(1).max(10).default("QAR"),
  color: z.string().max(20).default("#10B981"),
  icon: z.string().max(50).default("wallet"),
  is_active: z.boolean().default(true)
});
var updateAccountSchema = createAccountSchema.partial();
var createCategorySchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().min(1, "English name is required"),
  icon: z.string().max(50).default("tag"),
  color: z.string().max(20).default("#6B7280"),
  type: z.enum(["income", "expense", "savings", "commitment", "plan", "general"]),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_favorite: z.boolean().default(false)
});
var updateCategorySchema = createCategorySchema.partial();
var createTransactionSchema = z.object({
  account_id: z.string().min(1, "Account ID is required"),
  category_id: z.string().nullable().optional(),
  type: z.enum(["income", "expense"]),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).max(10).default("QAR"),
  date: z.string().or(z.date()).optional(),
  note: z.string().default(""),
  linked_commitment_id: z.string().nullable().optional(),
  linked_plan_id: z.string().nullable().optional(),
  linked_plan_category_id: z.string().nullable().optional(),
  linked_saving_wallet_id: z.string().nullable().optional(),
  linked_transfer_account_id: z.string().nullable().optional()
});
var updateTransactionSchema = createTransactionSchema.partial();
var createTransferSchema = z.object({
  source_account_id: z.string().min(1, "Source account is required"),
  destination_account_id: z.string().min(1, "Destination account is required"),
  source_amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  destination_amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  exchange_rate: z.union([z.string(), z.number()]).transform((v) => String(v)).default("1"),
  date: z.string().or(z.date()).optional(),
  note: z.string().default("")
}).refine(
  (data) => data.source_account_id !== data.destination_account_id,
  { message: "Source and destination accounts must be different", path: ["destination_account_id"] }
);
var createSavingsWalletSchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().min(1, "English name is required"),
  description: z.string().default(""),
  type: z.enum(["general_savings", "goal_savings"]).default("general_savings"),
  current_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).default("0"),
  target_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).nullable().optional(),
  target_date: z.string().or(z.date()).nullable().optional(),
  color: z.string().max(20).default("#10B981"),
  icon: z.string().max(50).default("piggy-bank"),
  is_default: z.boolean().default(false),
  is_archived: z.boolean().default(false)
});
var updateSavingsWalletSchema = createSavingsWalletSchema.partial();
var createSavingsTxSchema = z.object({
  wallet_id: z.string().min(1, "Wallet ID is required"),
  account_id: z.string().nullable().optional(),
  type: z.enum(["deposit_internal", "deposit_external", "withdraw_internal", "withdraw_external"]),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  date: z.string().or(z.date()).optional(),
  note: z.string().default("")
});
var createCommitmentSchema = z.object({
  account_id: z.string().min(1, "Account ID is required"),
  category_id: z.string().nullable().optional(),
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().min(1, "English name is required"),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  due_date: z.string().or(z.date()),
  recurrence_type: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("monthly"),
  status: z.enum(["upcoming", "due_today", "overdue", "paid"]).default("upcoming"),
  is_manual: z.boolean().default(false),
  paid_at: z.string().or(z.date()).nullable().optional(),
  note: z.string().default(""),
  parent_commitment_id: z.string().nullable().optional()
});
var updateCommitmentSchema = createCommitmentSchema.partial();
function handleError(res, e) {
  if (e instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: e.errors.map((err) => ({ field: err.path.join("."), message: err.message }))
    });
  }
  console.error("API Error:", e);
  return res.status(500).json({ message: errMsg(e) });
}
async function ensureDefaultUser() {
  try {
    const existing = await db.select().from(users).where(eq2(users.id, DEFAULT_USER_ID)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        id: DEFAULT_USER_ID,
        username: "default",
        password: "-"
      }).onConflictDoNothing();
    }
  } catch (e) {
    console.error("Failed to ensure default user:", e);
  }
}
async function registerRoutes(app2) {
  await ensureDefaultUser();
  app2.get("/api/docs", (_req, res) => {
    res.json(apiSpec);
  });
  app2.get("/api/accounts", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const rows = await storage.getAccounts(userId);
      res.json(rows.map(normAccount));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/accounts", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createAccountSchema.parse(body);
      const data = {
        ...validated,
        id: id || void 0,
        user_id: userId
      };
      const row = await storage.createAccount(data);
      res.status(201).json(normAccount(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.patch("/api/accounts/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getAccount(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = updateAccountSchema.parse(body);
      const row = await storage.updateAccount(paramId(req), validated);
      if (!row) return res.status(404).json({ message: "Account not found" });
      res.json(normAccount(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.delete("/api/accounts/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getAccount(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }
      const commitmentRefs = await db.select({ id: commitments.id }).from(commitments).where(and2(
        eq2(commitments.account_id, paramId(req)),
        eq2(commitments.user_id, userId)
      )).limit(1);
      if (commitmentRefs.length > 0) {
        return res.status(409).json({ message: "Cannot delete account: it has linked commitments. Remove them first." });
      }
      await storage.updateAccount(paramId(req), { is_active: false });
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const rows = await storage.getCategories(userId);
      res.json(rows.map(normCategory));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createCategorySchema.parse(body);
      const data = {
        ...validated,
        id: id || void 0,
        user_id: userId
      };
      const row = await storage.createCategory(data);
      res.status(201).json(normCategory(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.patch("/api/categories/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getCategory(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Category not found" });
      }
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = updateCategorySchema.parse(body);
      const row = await storage.updateCategory(paramId(req), validated);
      if (!row) return res.status(404).json({ message: "Category not found" });
      res.json(normCategory(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.delete("/api/categories/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getCategory(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Category not found" });
      }
      const txRefs = await db.select({ id: transactions.id }).from(transactions).where(and2(
        eq2(transactions.category_id, paramId(req)),
        eq2(transactions.user_id, userId)
      )).limit(1);
      if (txRefs.length > 0) {
        return res.status(409).json({ message: "Cannot delete category: it is used by transactions." });
      }
      await storage.deleteCategory(paramId(req));
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.get("/api/transactions", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const rows = await storage.getTransactions(userId);
      res.json(rows.map(normTransaction));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/transactions", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createTransactionSchema.parse(body);
      if (parseFloat(validated.amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      const data = {
        ...validated,
        id: id || void 0,
        user_id: userId,
        date: toDate(validated.date) ?? /* @__PURE__ */ new Date()
      };
      const row = await storage.createTransaction(data);
      res.status(201).json(normTransaction(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.patch("/api/transactions/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getTransaction(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const { date: rawDate, ...rest } = updateTransactionSchema.parse(body);
      const data = {
        ...rest,
        ...rawDate ? { date: toDate(rawDate) ?? void 0 } : {}
      };
      const row = await storage.updateTransaction(paramId(req), data);
      if (!row) return res.status(404).json({ message: "Transaction not found" });
      res.json(normTransaction(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.delete("/api/transactions/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getTransaction(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      await storage.deleteTransaction(paramId(req));
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.get("/api/transfers", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const rows = await storage.getTransfers(userId);
      res.json(rows.map(normTransfer));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/transfers", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id, created_at: _c, user_id: _uid, ...body } = req.body;
      const validated = createTransferSchema.parse(body);
      if (parseFloat(validated.source_amount) <= 0) {
        return res.status(400).json({ message: "Source amount must be greater than 0" });
      }
      const data = {
        ...validated,
        id: id || void 0,
        user_id: userId,
        date: toDate(validated.date) ?? /* @__PURE__ */ new Date()
      };
      const row = await storage.createTransfer(data);
      res.status(201).json(normTransfer(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.delete("/api/transfers/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getTransfer(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      await storage.deleteTransfer(paramId(req));
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.get("/api/savings-wallets", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const rows = await storage.getSavingsWallets(userId);
      res.json(rows.map(normSavingsWallet));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/savings-wallets", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createSavingsWalletSchema.parse(body);
      const data = {
        ...validated,
        id: id || void 0,
        user_id: userId,
        target_date: toDate(validated.target_date) ?? null
      };
      const row = await storage.createSavingsWallet(data);
      res.status(201).json(normSavingsWallet(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.patch("/api/savings-wallets/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getSavingsWallet(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Savings wallet not found" });
      }
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const { target_date: rawTargetDate, ...restWallet } = updateSavingsWalletSchema.parse(body);
      const data = {
        ...restWallet,
        ...rawTargetDate !== void 0 ? { target_date: toDate(rawTargetDate) } : {}
      };
      const row = await storage.updateSavingsWallet(paramId(req), data);
      if (!row) return res.status(404).json({ message: "Savings wallet not found" });
      res.json(normSavingsWallet(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.delete("/api/savings-wallets/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getSavingsWallet(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Savings wallet not found" });
      }
      await storage.deleteSavingsWallet(paramId(req));
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.get("/api/savings-transactions", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const walletId = req.query.walletId;
      const rows = await storage.getSavingsTransactions(walletId, userId);
      res.json(rows.map(normSavingsTx));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/savings-transactions", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id, created_at: _c, user_id: _uid, ...body } = req.body;
      const validated = createSavingsTxSchema.parse(body);
      if (parseFloat(validated.amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      const data = {
        ...validated,
        id: id || void 0,
        user_id: userId,
        date: toDate(validated.date) ?? /* @__PURE__ */ new Date()
      };
      const row = await storage.createSavingsTransaction(data);
      res.status(201).json(normSavingsTx(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.delete("/api/savings-transactions/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getSavingsTransaction(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Savings transaction not found" });
      }
      await storage.deleteSavingsTransaction(paramId(req));
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.get("/api/commitments", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const rows = await storage.getCommitments(userId);
      res.json(rows.map(normCommitment));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/commitments", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createCommitmentSchema.parse(body);
      if (parseFloat(validated.amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      const data = {
        ...validated,
        id: id || void 0,
        user_id: userId,
        due_date: toDate(validated.due_date) ?? /* @__PURE__ */ new Date(),
        paid_at: toDate(validated.paid_at)
      };
      const row = await storage.createCommitment(data);
      res.status(201).json(normCommitment(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.patch("/api/commitments/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getCommitment(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Commitment not found" });
      }
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const { due_date: rawDueDate, paid_at: rawPaidAt, ...restCommitment } = updateCommitmentSchema.parse(body);
      const data = {
        ...restCommitment,
        ...rawDueDate ? { due_date: toDate(rawDueDate) ?? void 0 } : {},
        ...rawPaidAt !== void 0 ? { paid_at: toDate(rawPaidAt) ?? void 0 } : {}
      };
      const row = await storage.updateCommitment(paramId(req), data);
      if (!row) return res.status(404).json({ message: "Commitment not found" });
      res.json(normCommitment(row));
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.delete("/api/commitments/:id", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const existing = await storage.getCommitment(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Commitment not found" });
      }
      await storage.deleteCommitment(paramId(req));
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  app2.post("/api/reset", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const confirmHeader = req.headers["x-confirm-reset"];
      if (confirmHeader !== "true") {
        return res.status(400).json({ message: "Reset requires X-Confirm-Reset: true header" });
      }
      await db.delete(commitments).where(eq2(commitments.user_id, userId));
      await db.delete(savingsTransactions).where(eq2(savingsTransactions.user_id, userId));
      await db.delete(savingsWallets).where(eq2(savingsWallets.user_id, userId));
      await db.delete(transfers).where(eq2(transfers.user_id, userId));
      await db.delete(transactions).where(eq2(transactions.user_id, userId));
      await db.delete(accounts).where(eq2(accounts.user_id, userId));
      res.json({ ok: true });
    } catch (e) {
      handleError(res, e);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
var app = express();
var log = console.log;
function setupCors(app2) {
  const allowedLocalPorts = /* @__PURE__ */ new Set(["3000", "5000", "8081", "19000", "19006"]);
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    if (process.env.CORS_ORIGINS) {
      process.env.CORS_ORIGINS.split(",").forEach((o) => {
        origins.add(o.trim());
      });
    }
    const origin = req.header("origin");
    let isAllowedLocalhost = false;
    if (process.env.NODE_ENV === "development" && origin) {
      try {
        const url = new URL(origin);
        const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        isAllowedLocalhost = isLocal && allowedLocalPorts.has(url.port);
      } catch {
      }
    }
    if (origin && (origins.has(origin) || isAllowedLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Confirm-Reset");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
var metroProxy = createProxyMiddleware({
  target: "http://localhost:8081",
  changeOrigin: true,
  ws: true,
  on: {
    error: (_err, _req, res) => {
      res.status(503).send("Metro bundler not available. Please wait for it to start.");
    }
  }
});
function serveExpoManifest(platform, req, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  const isDev = process.env.NODE_ENV === "development";
  log("Serving static Expo files with dynamic manifest routing");
  const distPath = path.resolve(process.cwd(), "dist");
  const hasWebExport = fs.existsSync(path.join(distPath, "index.html"));
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const platform = req.header("expo-platform");
    if ((req.path === "/" || req.path === "/manifest") && (platform === "ios" || platform === "android")) {
      if (isDev) {
        return metroProxy(req, res, next);
      }
      return serveExpoManifest(platform, req, res);
    }
    if (hasWebExport) {
      return next();
    }
    if (isDev) {
      if (req.path === "/") {
        return serveLandingPage({ req, res, landingPageTemplate, appName });
      }
      return metroProxy(req, res, next);
    }
    if (req.path === "/") {
      return serveLandingPage({ req, res, landingPageTemplate, appName });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  if (hasWebExport) {
    app2.use(express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      }
    }));
    app2.use((req, res, next) => {
      if (req.path.startsWith("/api") || req.path.includes(".")) {
        return next();
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
    log("Serving web app from dist/");
  }
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
