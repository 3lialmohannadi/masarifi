import { eq, desc, asc, and } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@database/schema";
import type {
  Account,
  InsertAccount,
  Category,
  InsertCategory,
  Transaction,
  InsertTransaction,
  Transfer,
  InsertTransfer,
  SavingsWallet,
  InsertSavingsWallet,
  SavingsTransaction,
  InsertSavingsTransaction,
  Commitment,
  InsertCommitment,
  Settings,
} from "@database/schema";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IStorage {
  // Settings
  getSettings(userId?: string): Promise<Settings | undefined>;
  upsertSettings(data: Partial<Settings>): Promise<Settings>;

  // Accounts
  getAccounts(userId?: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(data: InsertAccount): Promise<Account>;
  updateAccount(id: string, data: Partial<Account>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;

  // Categories
  getCategories(userId?: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Transactions
  getTransactions(userId?: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Transfers
  getTransfers(userId?: string): Promise<Transfer[]>;
  getTransfer(id: string): Promise<Transfer | undefined>;
  createTransfer(data: InsertTransfer): Promise<Transfer>;
  updateTransfer(id: string, data: Partial<Transfer>): Promise<Transfer>;
  deleteTransfer(id: string): Promise<void>;

  // Savings Wallets
  getSavingsWallets(userId?: string): Promise<SavingsWallet[]>;
  getSavingsWallet(id: string): Promise<SavingsWallet | undefined>;
  createSavingsWallet(data: InsertSavingsWallet): Promise<SavingsWallet>;
  updateSavingsWallet(id: string, data: Partial<SavingsWallet>): Promise<SavingsWallet>;
  deleteSavingsWallet(id: string): Promise<void>;

  // Savings Transactions
  getSavingsTransactions(walletId?: string, userId?: string): Promise<SavingsTransaction[]>;
  getSavingsTransaction(id: string): Promise<SavingsTransaction | undefined>;
  createSavingsTransaction(data: InsertSavingsTransaction): Promise<SavingsTransaction>;
  updateSavingsTransaction(id: string, data: Partial<SavingsTransaction>): Promise<SavingsTransaction>;
  deleteSavingsTransaction(id: string): Promise<void>;

  // Commitments
  getCommitments(userId?: string): Promise<Commitment[]>;
  getCommitment(id: string): Promise<Commitment | undefined>;
  createCommitment(data: InsertCommitment): Promise<Commitment>;
  updateCommitment(id: string, data: Partial<Commitment>): Promise<Commitment>;
  deleteCommitment(id: string): Promise<void>;

}

// ─── Database Storage ─────────────────────────────────────────────────────────

export class DatabaseStorage implements IStorage {

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings(userId?: string): Promise<Settings | undefined> {
    if (userId) {
      const [row] = await db.select().from(schema.settings).where(eq(schema.settings.user_id, userId));
      return row;
    }
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.id, 1));
    return row;
  }

  async upsertSettings(data: Partial<Settings>): Promise<Settings> {
    const existing = await this.getSettings(data.user_id ?? undefined);
    if (existing) {
      const [updated] = await db
        .update(schema.settings)
        .set({ ...data, updated_at: new Date() })
        .where(eq(schema.settings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(schema.settings).values(data as Settings).returning();
    return created;
  }

  // ── Accounts ───────────────────────────────────────────────────────────────

  async getAccounts(userId?: string): Promise<Account[]> {
    if (userId) {
      return db.select().from(schema.accounts)
        .where(eq(schema.accounts.user_id, userId))
        .orderBy(asc(schema.accounts.created_at));
    }
    return db.select().from(schema.accounts).orderBy(asc(schema.accounts.created_at));
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [row] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id));
    return row;
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    const [row] = await db.insert(schema.accounts).values(data).returning();
    return row;
  }

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const [row] = await db
      .update(schema.accounts)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.accounts.id, id))
      .returning();
    return row;
  }

  async deleteAccount(id: string): Promise<void> {
    await db.delete(schema.accounts).where(eq(schema.accounts.id, id));
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories(userId?: string): Promise<Category[]> {
    if (userId) {
      return db.select().from(schema.categories)
        .where(eq(schema.categories.user_id, userId))
        .orderBy(asc(schema.categories.created_at));
    }
    return db.select().from(schema.categories).orderBy(asc(schema.categories.created_at));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [row] = await db.select().from(schema.categories).where(eq(schema.categories.id, id));
    return row;
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [row] = await db.insert(schema.categories).values(data).returning();
    return row;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const [row] = await db
      .update(schema.categories)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.categories.id, id))
      .returning();
    return row;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  async getTransactions(userId?: string): Promise<Transaction[]> {
    if (userId) {
      return db.select().from(schema.transactions)
        .where(eq(schema.transactions.user_id, userId))
        .orderBy(desc(schema.transactions.date));
    }
    return db.select().from(schema.transactions).orderBy(desc(schema.transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id));
    return row;
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [row] = await db.insert(schema.transactions).values(data).returning();
    return row;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const [row] = await db
      .update(schema.transactions)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.transactions.id, id))
      .returning();
    return row;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
  }

  // ── Transfers ──────────────────────────────────────────────────────────────

  async getTransfers(userId?: string): Promise<Transfer[]> {
    if (userId) {
      return db.select().from(schema.transfers)
        .where(eq(schema.transfers.user_id, userId))
        .orderBy(desc(schema.transfers.date));
    }
    return db.select().from(schema.transfers).orderBy(desc(schema.transfers.date));
  }

  async getTransfer(id: string): Promise<Transfer | undefined> {
    const [row] = await db.select().from(schema.transfers).where(eq(schema.transfers.id, id));
    return row;
  }

  async createTransfer(data: InsertTransfer): Promise<Transfer> {
    const [row] = await db.insert(schema.transfers).values(data).returning();
    return row;
  }

  async updateTransfer(id: string, data: Partial<Transfer>): Promise<Transfer> {
    const [row] = await db
      .update(schema.transfers)
      .set(data)
      .where(eq(schema.transfers.id, id))
      .returning();
    return row;
  }

  async deleteTransfer(id: string): Promise<void> {
    await db.delete(schema.transfers).where(eq(schema.transfers.id, id));
  }

  // ── Savings Wallets ────────────────────────────────────────────────────────

  async getSavingsWallets(userId?: string): Promise<SavingsWallet[]> {
    if (userId) {
      return db.select().from(schema.savingsWallets)
        .where(eq(schema.savingsWallets.user_id, userId))
        .orderBy(asc(schema.savingsWallets.created_at));
    }
    return db.select().from(schema.savingsWallets).orderBy(asc(schema.savingsWallets.created_at));
  }

  async getSavingsWallet(id: string): Promise<SavingsWallet | undefined> {
    const [row] = await db.select().from(schema.savingsWallets).where(eq(schema.savingsWallets.id, id));
    return row;
  }

  async createSavingsWallet(data: InsertSavingsWallet): Promise<SavingsWallet> {
    const [row] = await db.insert(schema.savingsWallets).values(data).returning();
    return row;
  }

  async updateSavingsWallet(id: string, data: Partial<SavingsWallet>): Promise<SavingsWallet> {
    const [row] = await db
      .update(schema.savingsWallets)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.savingsWallets.id, id))
      .returning();
    return row;
  }

  async deleteSavingsWallet(id: string): Promise<void> {
    await db.delete(schema.savingsWallets).where(eq(schema.savingsWallets.id, id));
  }

  // ── Savings Transactions ───────────────────────────────────────────────────

  async getSavingsTransactions(walletId?: string, userId?: string): Promise<SavingsTransaction[]> {
    const conditions = [];
    if (walletId) conditions.push(eq(schema.savingsTransactions.wallet_id, walletId));
    if (userId) conditions.push(eq(schema.savingsTransactions.user_id, userId));

    const query = db.select().from(schema.savingsTransactions);
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(schema.savingsTransactions.date));
    }
    return query.orderBy(desc(schema.savingsTransactions.date));
  }

  async getSavingsTransaction(id: string): Promise<SavingsTransaction | undefined> {
    const [row] = await db.select().from(schema.savingsTransactions).where(eq(schema.savingsTransactions.id, id));
    return row;
  }

  async createSavingsTransaction(data: InsertSavingsTransaction): Promise<SavingsTransaction> {
    const [row] = await db.insert(schema.savingsTransactions).values(data).returning();
    return row;
  }

  async updateSavingsTransaction(id: string, data: Partial<SavingsTransaction>): Promise<SavingsTransaction> {
    const [row] = await db
      .update(schema.savingsTransactions)
      .set(data)
      .where(eq(schema.savingsTransactions.id, id))
      .returning();
    return row;
  }

  async deleteSavingsTransaction(id: string): Promise<void> {
    await db.delete(schema.savingsTransactions).where(eq(schema.savingsTransactions.id, id));
  }

  // ── Commitments ────────────────────────────────────────────────────────────

  async getCommitments(userId?: string): Promise<Commitment[]> {
    if (userId) {
      return db.select().from(schema.commitments)
        .where(eq(schema.commitments.user_id, userId))
        .orderBy(asc(schema.commitments.due_date));
    }
    return db.select().from(schema.commitments).orderBy(asc(schema.commitments.due_date));
  }

  async getCommitment(id: string): Promise<Commitment | undefined> {
    const [row] = await db.select().from(schema.commitments).where(eq(schema.commitments.id, id));
    return row;
  }

  async createCommitment(data: InsertCommitment): Promise<Commitment> {
    const [row] = await db.insert(schema.commitments).values(data).returning();
    return row;
  }

  async updateCommitment(id: string, data: Partial<Commitment>): Promise<Commitment> {
    const [row] = await db
      .update(schema.commitments)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.commitments.id, id))
      .returning();
    return row;
  }

  async deleteCommitment(id: string): Promise<void> {
    await db.delete(schema.commitments).where(eq(schema.commitments.id, id));
  }

}

export const storage = new DatabaseStorage();
