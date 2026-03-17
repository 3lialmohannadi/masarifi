import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@database/schema";
import { eq, and } from "drizzle-orm";
import { z, ZodError } from "zod";
import { apiSpec } from "./api-docs";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

function getUserId(req: Request): string {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    try {
      const token = auth.slice(7);
      const parts = token.split(".");
      if (parts.length === 3) {
        const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
        if (payload.sub && typeof payload.sub === "string") {
          return payload.sub;
        }
      }
    } catch {
      // fall through to default
    }
  }
  return DEFAULT_USER_ID;
}

async function ensureUser(userId: string): Promise<void> {
  if (userId === DEFAULT_USER_ID) return;
  try {
    const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.users).values({
        id: userId,
        username: userId,
        password: "-",
      }).onConflictDoNothing();
    }
  } catch {
    // ignore
  }
}

type AccountRow = typeof schema.accounts.$inferSelect;
type TransactionRow = typeof schema.transactions.$inferSelect;
type TransferRow = typeof schema.transfers.$inferSelect;
type SavingsWalletRow = typeof schema.savingsWallets.$inferSelect;
type SavingsTxRow = typeof schema.savingsTransactions.$inferSelect;
type CommitmentRow = typeof schema.commitments.$inferSelect;
type CategoryRow = typeof schema.categories.$inferSelect;

/** Safely extract a route param as string (Express 5 returns string | string[]). */
function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

function errMsg(e: unknown): string {
  if (e instanceof ZodError) {
    return e.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ");
  }
  return e instanceof Error ? e.message : String(e);
}

/**
 * Converts a Postgres `numeric` column value (returned as a string by pg driver)
 * or an existing JS number to a proper JS number.
 * Falls back to `fallback` (default 0) when the value is null/undefined/NaN.
 */
function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === "number") return isNaN(value) ? fallback : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Converts a Date object or ISO string to an ISO string.
 * Falls back to the current timestamp when the value is null/undefined.
 */
function toIso(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Date) return d.toISOString();
  return d;
}

/**
 * Like toIso, but returns null for missing values instead of falling back to now.
 */
function toIsoOrNull(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return d;
}

/** Parses a date string or Date object into a Date, returning null if the value is empty. */
function toDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d;
}

/** Normalises an accounts DB row for the API response. */
function normAccount(a: AccountRow) {
  return {
    ...a,
    balance: toNumber(a.balance),
    created_at: toIso(a.created_at),
    updated_at: toIso(a.updated_at),
  };
}

/** Normalises a transactions DB row for the API response. */
function normTransaction(t: TransactionRow) {
  return {
    ...t,
    amount: toNumber(t.amount),
    date: toIso(t.date),
    created_at: toIso(t.created_at),
    updated_at: toIso(t.updated_at),
  };
}

/** Normalises a transfers DB row for the API response. */
function normTransfer(t: TransferRow) {
  return {
    ...t,
    source_amount: toNumber(t.source_amount),
    destination_amount: toNumber(t.destination_amount),
    exchange_rate: toNumber(t.exchange_rate, 1),
    date: toIso(t.date),
    created_at: toIso(t.created_at),
  };
}

/** Normalises a savings_wallets DB row for the API response. */
function normSavingsWallet(w: SavingsWalletRow) {
  return {
    ...w,
    current_amount: toNumber(w.current_amount),
    target_amount: w.target_amount != null ? toNumber(w.target_amount) : undefined,
    target_date: toIsoOrNull(w.target_date),
    created_at: toIso(w.created_at),
    updated_at: toIso(w.updated_at),
  };
}

/** Normalises a savings_transactions DB row for the API response. */
function normSavingsTx(t: SavingsTxRow) {
  return {
    ...t,
    amount: toNumber(t.amount),
    date: toIso(t.date),
    created_at: toIso(t.created_at),
  };
}

/** Normalises a commitments DB row for the API response. */
function normCommitment(c: CommitmentRow) {
  return {
    ...c,
    amount: toNumber(c.amount),
    due_date: toIso(c.due_date),
    paid_at: toIsoOrNull(c.paid_at),
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at),
  };
}

/** Normalises a categories DB row for the API response. */
function normCategory(c: CategoryRow) {
  return {
    ...c,
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at),
  };
}

// ── Validation Schemas ────────────────────────────────────────────────────────

const createAccountSchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().optional().default(""),
  type: z.enum(["current", "cash", "travel", "savings_bank", "wallet", "credit", "investment"]),
  balance: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().default("0"),
  currency: z.string().min(1).max(10).default("QAR"),
  color: z.string().max(20).default("#10B981"),
  icon: z.string().max(50).default("wallet"),
  is_active: z.boolean().default(true),
});

const updateAccountSchema = createAccountSchema.partial();

const createCategorySchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().optional().default(""),
  icon: z.string().max(50).default("tag"),
  color: z.string().max(20).default("#6B7280"),
  type: z.enum(["income", "expense", "savings", "commitment", "plan", "general"]),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_favorite: z.boolean().default(false),
});

const updateCategorySchema = createCategorySchema.partial();

const createTransactionSchema = z.object({
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
  linked_transfer_account_id: z.string().nullable().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const createTransferSchema = z.object({
  source_account_id: z.string().min(1, "Source account is required"),
  destination_account_id: z.string().min(1, "Destination account is required"),
  source_amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  destination_amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  exchange_rate: z.union([z.string(), z.number()]).transform((v) => String(v)).default("1"),
  date: z.string().or(z.date()).optional(),
  note: z.string().default(""),
}).refine(
  (data) => data.source_account_id !== data.destination_account_id,
  { message: "Source and destination accounts must be different", path: ["destination_account_id"] }
);

const createSavingsWalletSchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().optional().default(""),
  description: z.string().default(""),
  type: z.enum(["general_savings", "goal_savings"]).default("general_savings"),
  current_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).default("0"),
  target_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).nullable().optional(),
  target_date: z.string().or(z.date()).nullable().optional(),
  color: z.string().max(20).default("#10B981"),
  icon: z.string().max(50).default("piggy-bank"),
  is_default: z.boolean().default(false),
  is_archived: z.boolean().default(false),
});

const updateSavingsWalletSchema = createSavingsWalletSchema.partial();

const createSavingsTxSchema = z.object({
  wallet_id: z.string().min(1, "Wallet ID is required"),
  account_id: z.string().nullable().optional(),
  type: z.enum(["deposit_internal", "deposit_external", "withdraw_internal", "withdraw_external"]),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  date: z.string().or(z.date()).optional(),
  note: z.string().default(""),
});

const createCommitmentSchema = z.object({
  account_id: z.string().min(1, "Account ID is required"),
  category_id: z.string().nullable().optional(),
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().optional().default(""),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  due_date: z.string().or(z.date()),
  recurrence_type: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("monthly"),
  status: z.enum(["upcoming", "due_today", "overdue", "paid"]).default("upcoming"),
  is_manual: z.boolean().default(false),
  paid_at: z.string().or(z.date()).nullable().optional(),
  note: z.string().default(""),
  parent_commitment_id: z.string().nullable().optional(),
});

const updateCommitmentSchema = createCommitmentSchema.partial();

// ── Helper to handle validation errors ────────────────────────────────────────

function handleError(res: Response, e: unknown) {
  if (e instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: e.errors.map((err) => ({ field: err.path.join("."), message: err.message })),
    });
  }
  console.error("API Error:", e);
  return res.status(500).json({ message: errMsg(e) });
}

// ── Default user bootstrap ──────────────────────────────────────────────────

async function ensureDefaultUser() {
  try {
    const existing = await db.select().from(schema.users).where(eq(schema.users.id, DEFAULT_USER_ID)).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.users).values({
        id: DEFAULT_USER_ID,
        username: "default",
        password: "-",
      }).onConflictDoNothing();
    }
  } catch (e) {
    console.error("Failed to ensure default user:", e);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureDefaultUser();

  // ── API Documentation (public) ─────────────────────────────────────────────

  app.get("/api/docs", (_req: Request, res: Response) => {
    res.json(apiSpec);
  });

  // ── Contact ───────────────────────────────────────────────────────────────

  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { type, subject, message, email } = req.body as {
        type: string;
        subject: string;
        message: string;
        email?: string | null;
      };
      if (!type || !subject || !message) {
        return res.status(400).json({ error: "type, subject, and message are required" });
      }
      const timestamp = new Date().toISOString();
      console.log(
        `[Contact] ${timestamp} | Type: ${type} | Subject: ${subject}` +
          (email ? ` | Email: ${email}` : "") +
          `\n  Message: ${message}`
      );
      return res.json({ ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return res.status(500).json({ error: msg });
    }
  });

  // ── Accounts ──────────────────────────────────────────────────────────────

  app.get("/api/accounts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getAccounts(userId);
      res.json(rows.map(normAccount));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createAccountSchema.parse(body);
      const data = {
        ...validated,
        name_en: validated.name_en || validated.name_ar,
        id: id || undefined,
        user_id: userId,
      };
      const row = await storage.createAccount(data);
      res.status(201).json(normAccount(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.patch("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getAccount(paramId(req));
      const { id: _reqId, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;

      if (!existing || existing.user_id !== userId) {
        // Account not on server yet — create it (handles race condition during sync)
        const validated = createAccountSchema.parse(body);
        const data = {
          ...validated,
          name_en: validated.name_en || validated.name_ar,
          id: paramId(req),
          user_id: userId,
        };
        const row = await storage.createAccount(data);
        return res.status(201).json(normAccount(row));
      }

      const validated = updateAccountSchema.parse(body);
      const row = await storage.updateAccount(paramId(req), {
        ...validated,
        ...(validated.name_en !== undefined ? { name_en: validated.name_en || existing.name_en || existing.name_ar } : {}),
      });
      if (!row) return res.status(404).json({ message: "Account not found" });
      res.json(normAccount(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getAccount(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }
      // Check for referencing commitments (restrict deletion)
      const commitmentRefs = await db.select({ id: schema.commitments.id })
        .from(schema.commitments)
        .where(and(
          eq(schema.commitments.account_id, paramId(req)),
          eq(schema.commitments.user_id, userId)
        ))
        .limit(1);
      if (commitmentRefs.length > 0) {
        return res.status(409).json({ message: "Cannot delete account: it has linked commitments. Remove them first." });
      }
      // Soft-delete
      await storage.updateAccount(paramId(req), { is_active: false });
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Categories ────────────────────────────────────────────────────────────

  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getCategories(userId);
      res.json(rows.map(normCategory));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createCategorySchema.parse(body);
      const data = {
        ...validated,
        name_en: validated.name_en || validated.name_ar,
        id: id || undefined,
        user_id: userId,
      };
      const row = await storage.createCategory(data);
      res.status(201).json(normCategory(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.patch("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getCategory(paramId(req));
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;

      if (!existing || existing.user_id !== userId) {
        // Category not on server yet — create it (handles race condition during sync)
        const validated = createCategorySchema.parse(body);
        const data = {
          ...validated,
          name_en: validated.name_en || validated.name_ar,
          id: paramId(req),
          user_id: userId,
        };
        const row = await storage.createCategory(data);
        return res.status(201).json(normCategory(row));
      }

      const validated = updateCategorySchema.parse(body);
      const row = await storage.updateCategory(paramId(req), {
        ...validated,
        ...(validated.name_en !== undefined ? { name_en: validated.name_en || existing.name_en || existing.name_ar } : {}),
      });
      if (!row) return res.status(404).json({ message: "Category not found" });
      res.json(normCategory(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getCategory(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Category not found" });
      }
      // Check for referencing transactions (scoped to current user)
      const txRefs = await db.select({ id: schema.transactions.id })
        .from(schema.transactions)
        .where(and(
          eq(schema.transactions.category_id, paramId(req)),
          eq(schema.transactions.user_id, userId)
        ))
        .limit(1);
      if (txRefs.length > 0) {
        return res.status(409).json({ message: "Cannot delete category: it is used by transactions." });
      }
      await storage.deleteCategory(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Transactions ──────────────────────────────────────────────────────────

  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getTransactions(userId);
      res.json(rows.map(normTransaction));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createTransactionSchema.parse(body);
      if (parseFloat(validated.amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      // Verify the account exists before inserting (gives a clear 404 instead of a FK 500)
      const account = await storage.getAccount(validated.account_id);
      if (!account || account.user_id !== userId) {
        return res.status(409).json({ message: "Account not synced yet — retry after account sync" });
      }
      const data = {
        ...validated,
        id: id || undefined,
        user_id: userId,
        date: toDate(validated.date) ?? new Date(),
      };
      const row = await storage.createTransaction(data);
      res.status(201).json(normTransaction(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.patch("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getTransaction(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const { date: rawDate, ...rest } = updateTransactionSchema.parse(body);
      const data = {
        ...rest,
        ...(rawDate ? { date: toDate(rawDate) ?? undefined } : {}),
      };
      const row = await storage.updateTransaction(paramId(req), data);
      if (!row) return res.status(404).json({ message: "Transaction not found" });
      res.json(normTransaction(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getTransaction(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      await storage.deleteTransaction(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Transfers ─────────────────────────────────────────────────────────────

  app.get("/api/transfers", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getTransfers(userId);
      res.json(rows.map(normTransfer));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/transfers", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, user_id: _uid, ...body } = req.body;
      const validated = createTransferSchema.parse(body);
      if (parseFloat(validated.source_amount) <= 0) {
        return res.status(400).json({ message: "Source amount must be greater than 0" });
      }
      const data = {
        ...validated,
        id: id || undefined,
        user_id: userId,
        date: toDate(validated.date) ?? new Date(),
      };
      const row = await storage.createTransfer(data);
      res.status(201).json(normTransfer(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/transfers/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getTransfer(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      await storage.deleteTransfer(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Savings Wallets ───────────────────────────────────────────────────────

  app.get("/api/savings-wallets", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getSavingsWallets(userId);
      res.json(rows.map(normSavingsWallet));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/savings-wallets", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createSavingsWalletSchema.parse(body);
      const data = {
        ...validated,
        name_en: validated.name_en || validated.name_ar,
        id: id || undefined,
        user_id: userId,
        target_date: toDate(validated.target_date) ?? null,
      };
      const row = await storage.createSavingsWallet(data);
      res.status(201).json(normSavingsWallet(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.patch("/api/savings-wallets/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getSavingsWallet(paramId(req));
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;

      if (!existing || existing.user_id !== userId) {
        // Wallet not on server yet — create it (handles race condition during sync)
        const validated = createSavingsWalletSchema.parse(body);
        const data = {
          ...validated,
          name_en: validated.name_en || validated.name_ar,
          id: paramId(req),
          user_id: userId,
          target_date: toDate(validated.target_date) ?? null,
        };
        const row = await storage.createSavingsWallet(data);
        return res.status(201).json(normSavingsWallet(row));
      }

      const { target_date: rawTargetDate, ...restWallet } = updateSavingsWalletSchema.parse(body);
      const data = {
        ...restWallet,
        ...(restWallet.name_en !== undefined ? { name_en: restWallet.name_en || existing.name_en || existing.name_ar } : {}),
        ...(rawTargetDate !== undefined ? { target_date: toDate(rawTargetDate) } : {}),
      };
      const row = await storage.updateSavingsWallet(paramId(req), data);
      if (!row) return res.status(404).json({ message: "Savings wallet not found" });
      res.json(normSavingsWallet(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/savings-wallets/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getSavingsWallet(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Savings wallet not found" });
      }
      await storage.deleteSavingsWallet(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Savings Transactions ──────────────────────────────────────────────────

  app.get("/api/savings-transactions", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const walletId = req.query.walletId as string | undefined;
      const rows = await storage.getSavingsTransactions(walletId, userId);
      res.json(rows.map(normSavingsTx));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/savings-transactions", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, user_id: _uid, ...body } = req.body;
      const validated = createSavingsTxSchema.parse(body);
      if (parseFloat(validated.amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      // Verify wallet exists before inserting
      const wallet = await storage.getSavingsWallet(validated.wallet_id);
      if (!wallet || wallet.user_id !== userId) {
        return res.status(409).json({ message: "Savings wallet not synced yet — retry after wallet sync" });
      }
      const data = {
        ...validated,
        id: id || undefined,
        user_id: userId,
        date: toDate(validated.date) ?? new Date(),
      };
      const row = await storage.createSavingsTransaction(data);
      res.status(201).json(normSavingsTx(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/savings-transactions/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getSavingsTransaction(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Savings transaction not found" });
      }
      await storage.deleteSavingsTransaction(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Commitments ───────────────────────────────────────────────────────────

  app.get("/api/commitments", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getCommitments(userId);
      res.json(rows.map(normCommitment));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/commitments", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createCommitmentSchema.parse(body);
      if (parseFloat(validated.amount) <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }
      // Verify the account exists before inserting
      const account = await storage.getAccount(validated.account_id);
      if (!account || account.user_id !== userId) {
        return res.status(409).json({ message: "Account not synced yet — retry after account sync" });
      }
      const data = {
        ...validated,
        name_en: validated.name_en || validated.name_ar,
        id: id || undefined,
        user_id: userId,
        due_date: toDate(validated.due_date) ?? new Date(),
        paid_at: toDate(validated.paid_at),
      };
      const row = await storage.createCommitment(data);
      res.status(201).json(normCommitment(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.patch("/api/commitments/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getCommitment(paramId(req));
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;

      if (!existing || existing.user_id !== userId) {
        // Commitment not on server yet — create it (handles race condition during sync)
        const validated = createCommitmentSchema.parse(body);
        const account = await storage.getAccount(validated.account_id);
        if (!account || account.user_id !== userId) {
          return res.status(409).json({ message: "Account not synced yet — retry after account sync" });
        }
        const data = {
          ...validated,
          name_en: validated.name_en || validated.name_ar,
          id: paramId(req),
          user_id: userId,
          due_date: toDate(validated.due_date) ?? new Date(),
          paid_at: toDate(validated.paid_at),
        };
        const row = await storage.createCommitment(data);
        return res.status(201).json(normCommitment(row));
      }

      const { due_date: rawDueDate, paid_at: rawPaidAt, ...restCommitment } = updateCommitmentSchema.parse(body);
      const data = {
        ...restCommitment,
        ...(restCommitment.name_en !== undefined ? { name_en: restCommitment.name_en || existing.name_en || existing.name_ar } : {}),
        ...(rawDueDate ? { due_date: toDate(rawDueDate) ?? undefined } : {}),
        ...(rawPaidAt !== undefined ? { paid_at: toDate(rawPaidAt) ?? undefined } : {}),
      };
      const row = await storage.updateCommitment(paramId(req), data);
      if (!row) return res.status(404).json({ message: "Commitment not found" });
      res.json(normCommitment(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/commitments/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getCommitment(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Commitment not found" });
      }
      await storage.deleteCommitment(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Debts ────────────────────────────────────────────────────────────────────

  const createDebtSchema = z.object({
    category: z.enum(["bank", "personal", "company"]).default("personal"),
    subcategory: z.string().min(1).max(50).default("personal_borrow"),
    subcategory_ar: z.string().default(""),
    subcategory_en: z.string().default(""),
    subcategory_icon: z.string().max(60).default("bank"),
    subcategory_color: z.string().max(20).default("#6B7280"),
    entity_name: z.string().min(1),
    original_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).default("0"),
    remaining_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).default("0"),
    paid_amount: z.union([z.string(), z.number()]).transform((v) => String(v)).default("0"),
    monthly_installment: z.union([z.string(), z.number()]).transform((v) => String(v)).default("0"),
    repayment_months: z.union([z.string(), z.number()]).transform((v) => Number(v)).default(0),
    total_installments: z.union([z.string(), z.number()]).transform((v) => Number(v)).default(0),
    completed_installments: z.union([z.string(), z.number()]).transform((v) => Number(v)).default(0),
    is_installment_based: z.boolean().default(false),
    due_date: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    notes: z.string().default(""),
    status: z.enum(["active", "completed", "overdue"]).default("active"),
    currency: z.string().max(10).default("QAR"),
  });

  const updateDebtSchema = createDebtSchema.partial();

  const createDebtPaymentSchema = z.object({
    debt_id: z.string().min(1),
    amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
    date: z.string(),
    note: z.string().default(""),
  });

  function normDebt(d: schema.Debt) {
    return {
      ...d,
      original_amount: toNumber(d.original_amount),
      remaining_amount: toNumber(d.remaining_amount),
      paid_amount: toNumber(d.paid_amount),
      monthly_installment: toNumber(d.monthly_installment),
      due_date: toIsoOrNull(d.due_date),
      start_date: toIsoOrNull(d.start_date),
      end_date: toIsoOrNull(d.end_date),
      created_at: toIso(d.created_at),
      updated_at: toIso(d.updated_at),
    };
  }

  function normDebtPayment(p: schema.DebtPayment) {
    return {
      ...p,
      amount: toNumber(p.amount),
      date: toIso(p.date),
      created_at: toIso(p.created_at),
    };
  }

  app.get("/api/debts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getDebts(userId);
      res.json(rows.map(normDebt));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/debts", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const { id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      const validated = createDebtSchema.parse(body);
      const data = {
        ...validated,
        id: id || undefined,
        user_id: userId,
        due_date: toDate(validated.due_date),
        start_date: toDate(validated.start_date),
        end_date: toDate(validated.end_date),
      };
      const row = await storage.createDebt(data);
      res.status(201).json(normDebt(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.patch("/api/debts/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getDebt(paramId(req));
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...body } = req.body;
      if (!existing || existing.user_id !== userId) {
        const validated = createDebtSchema.parse(body);
        const data = {
          ...validated,
          id: paramId(req),
          user_id: userId,
          due_date: toDate(validated.due_date),
          start_date: toDate(validated.start_date),
          end_date: toDate(validated.end_date),
        };
        const row = await storage.createDebt(data);
        return res.status(201).json(normDebt(row));
      }
      const { due_date, start_date, end_date, ...rest } = updateDebtSchema.parse(body);
      const data = {
        ...rest,
        ...(due_date !== undefined ? { due_date: toDate(due_date) ?? undefined } : {}),
        ...(start_date !== undefined ? { start_date: toDate(start_date) ?? undefined } : {}),
        ...(end_date !== undefined ? { end_date: toDate(end_date) ?? undefined } : {}),
      };
      const row = await storage.updateDebt(paramId(req), data);
      if (!row) return res.status(404).json({ message: "Debt not found" });
      res.json(normDebt(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/debts/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const existing = await storage.getDebt(paramId(req));
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Debt not found" });
      }
      await storage.deleteDebt(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.get("/api/debts/:id/payments", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const debtId = paramId(req);
      const existing = await storage.getDebt(debtId);
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Debt not found" });
      }
      const rows = await storage.getDebtPayments(debtId);
      res.json(rows.map(normDebtPayment));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/debts/:id/payments", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const debtId = paramId(req);
      const existing = await storage.getDebt(debtId);
      if (!existing || existing.user_id !== userId) {
        return res.status(404).json({ message: "Debt not found" });
      }
      const { id, created_at: _c, ...body } = req.body;
      const validated = createDebtPaymentSchema.parse({ ...body, debt_id: debtId });
      const row = await storage.createDebtPayment({
        ...validated,
        date: toDate(validated.date) ?? new Date(),
      });
      res.status(201).json(normDebtPayment(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/debt-payments/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const payment = await storage.getDebtPayment(paramId(req));
      if (payment) {
        const debt = await storage.getDebt(payment.debt_id);
        if (!debt || debt.user_id !== userId) {
          return res.status(404).json({ message: "Payment not found" });
        }
      }
      await storage.deleteDebtPayment(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Settings ──────────────────────────────────────────────────────────────

  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const row = await storage.getSettings(userId);
      res.json(row ?? {});
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.patch("/api/settings", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const parsed = schema.updateSettingsSchema.parse({ ...req.body, user_id: userId });
      const row = await storage.upsertSettings(parsed);
      res.json(row);
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Budgets ────────────────────────────────────────────────────────────────

  const upsertBudgetSchema = z.object({
    category_id: z.string().min(1, "Category ID is required"),
    amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
    month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
  });

  type BudgetRow = typeof schema.budgets.$inferSelect;
  function normBudget(b: BudgetRow) {
    return {
      ...b,
      amount: toNumber(b.amount),
      created_at: toIso(b.created_at),
      updated_at: toIso(b.updated_at),
    };
  }

  app.get("/api/budgets", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const rows = await storage.getBudgets(userId);
      res.json(rows.map(normBudget));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.post("/api/budgets", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const validated = upsertBudgetSchema.parse(req.body);
      const row = await storage.upsertBudget({ ...validated, user_id: userId });
      res.json(normBudget(row));
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  app.delete("/api/budgets/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      await storage.deleteBudget(paramId(req));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  // ── Reset (protected, requires confirmation header) ───────────────────────

  app.post("/api/reset", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req); await ensureUser(userId);
      const confirmHeader = req.headers["x-confirm-reset"];
      if (confirmHeader !== "true") {
        return res.status(400).json({ message: "Reset requires X-Confirm-Reset: true header" });
      }

      await db.delete(schema.commitments).where(eq(schema.commitments.user_id, userId));
      await db.delete(schema.savingsTransactions).where(eq(schema.savingsTransactions.user_id, userId));
      await db.delete(schema.savingsWallets).where(eq(schema.savingsWallets.user_id, userId));
      await db.delete(schema.transfers).where(eq(schema.transfers.user_id, userId));
      await db.delete(schema.transactions).where(eq(schema.transactions.user_id, userId));
      await db.delete(schema.accounts).where(eq(schema.accounts.user_id, userId));
      res.json({ ok: true });
    } catch (e: unknown) {
      handleError(res, e);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
