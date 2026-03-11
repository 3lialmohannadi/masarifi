import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@database/schema";
import { eq } from "drizzle-orm";

type AccountRow = typeof schema.accounts.$inferSelect;
type TransactionRow = typeof schema.transactions.$inferSelect;
type TransferRow = typeof schema.transfers.$inferSelect;
type SavingsWalletRow = typeof schema.savingsWallets.$inferSelect;
type SavingsTxRow = typeof schema.savingsTransactions.$inferSelect;
type CommitmentRow = typeof schema.commitments.$inferSelect;
type CategoryRow = typeof schema.categories.$inferSelect;

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const DEFAULT_USER_ID = "default-user";

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
 * Falls back to the current timestamp when the value is null/undefined —
 * this ensures required timestamp fields (created_at, updated_at) always
 * have a valid value even if the DB row is missing them.
 */
function toIso(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Date) return d.toISOString();
  return d;
}

/**
 * Like toIso, but returns null for missing values instead of falling back to now.
 * Used for optional timestamp fields (e.g. paid_at, target_date).
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
  return new Date(val);
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

/**
 * Bootstraps a single default user record on first run.
 * This app is single-tenant (offline-first / personal use), so there is no
 * authentication — all data belongs to this one pre-seeded user.
 */
async function ensureDefaultUser() {
  try {
    const existing = await storage.getUser(DEFAULT_USER_ID);
    if (!existing) {
      await db.insert(schema.users).values({
        id: DEFAULT_USER_ID,
        username: "default",
        password: "default",
      }).onConflictDoNothing();
    }
  } catch (e) {
    console.error("Failed to ensure default user:", e);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureDefaultUser();

  // ── Accounts ──────────────────────────────────────────────────────────────

  app.get("/api/accounts", async (_req, res) => {
    try {
      const rows = await storage.getAccounts(DEFAULT_USER_ID);
      res.json(rows.map(normAccount));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID };
      const row = await storage.createAccount(data as any);
      res.json(normAccount(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const row = await storage.updateAccount(req.params.id, rest as any);
      if (!row) return res.status(404).json({ message: "Account not found" });
      res.json(normAccount(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      await storage.updateAccount(req.params.id, { is_active: false } as any);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  // ── Categories ────────────────────────────────────────────────────────────

  app.get("/api/categories", async (_req, res) => {
    try {
      const rows = await storage.getCategories(DEFAULT_USER_ID);
      res.json(rows.map(normCategory));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID };
      const row = await storage.createCategory(data as any);
      res.json(normCategory(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const row = await storage.updateCategory(req.params.id, rest as any);
      if (!row) return res.status(404).json({ message: "Category not found" });
      res.json(normCategory(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  // ── Transactions ──────────────────────────────────────────────────────────

  app.get("/api/transactions", async (_req, res) => {
    try {
      const rows = await storage.getTransactions(DEFAULT_USER_ID);
      res.json(rows.map(normTransaction));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, date: toDate(rest.date) ?? new Date() };
      const row = await storage.createTransaction(data as any);
      res.json(normTransaction(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const data = { ...rest, ...(rest.date ? { date: toDate(rest.date) } : {}) };
      const row = await storage.updateTransaction(req.params.id, data as any);
      if (!row) return res.status(404).json({ message: "Transaction not found" });
      res.json(normTransaction(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  // ── Transfers ─────────────────────────────────────────────────────────────

  app.get("/api/transfers", async (_req, res) => {
    try {
      const rows = await storage.getTransfers(DEFAULT_USER_ID);
      res.json(rows.map(normTransfer));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/transfers", async (req, res) => {
    try {
      const { id, created_at: _c, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, date: toDate(rest.date) ?? new Date() };
      const row = await storage.createTransfer(data as any);
      res.json(normTransfer(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.delete("/api/transfers/:id", async (req, res) => {
    try {
      await storage.deleteTransfer(req.params.id);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  // ── Savings Wallets ───────────────────────────────────────────────────────

  app.get("/api/savings-wallets", async (_req, res) => {
    try {
      const rows = await storage.getSavingsWallets(DEFAULT_USER_ID);
      res.json(rows.map(normSavingsWallet));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/savings-wallets", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, target_date: toDate(rest.target_date) };
      const row = await storage.createSavingsWallet(data as any);
      res.json(normSavingsWallet(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.patch("/api/savings-wallets/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const data = { ...rest, ...(rest.target_date !== undefined ? { target_date: toDate(rest.target_date) } : {}) };
      const row = await storage.updateSavingsWallet(req.params.id, data as any);
      if (!row) return res.status(404).json({ message: "Savings wallet not found" });
      res.json(normSavingsWallet(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.delete("/api/savings-wallets/:id", async (req, res) => {
    try {
      await storage.deleteSavingsWallet(req.params.id);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  // ── Savings Transactions ──────────────────────────────────────────────────

  app.get("/api/savings-transactions", async (req, res) => {
    try {
      const walletId = req.query.walletId as string | undefined;
      const rows = await storage.getSavingsTransactions(walletId);
      res.json(rows.map(normSavingsTx));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/savings-transactions", async (req, res) => {
    try {
      const { id, created_at: _c, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, date: toDate(rest.date) ?? new Date() };
      const row = await storage.createSavingsTransaction(data as any);
      res.json(normSavingsTx(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.delete("/api/savings-transactions/:id", async (req, res) => {
    try {
      await storage.deleteSavingsTransaction(req.params.id);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  // ── Commitments ───────────────────────────────────────────────────────────

  app.get("/api/commitments", async (_req, res) => {
    try {
      const rows = await storage.getCommitments(DEFAULT_USER_ID);
      res.json(rows.map(normCommitment));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/commitments", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = {
        ...rest, id, user_id: DEFAULT_USER_ID,
        due_date: toDate(rest.due_date) ?? new Date(),
        paid_at: toDate(rest.paid_at),
      };
      const row = await storage.createCommitment(data as any);
      res.json(normCommitment(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.patch("/api/commitments/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const data = {
        ...rest,
        ...(rest.due_date ? { due_date: toDate(rest.due_date) } : {}),
        ...(rest.paid_at !== undefined ? { paid_at: toDate(rest.paid_at) } : {}),
      };
      const row = await storage.updateCommitment(req.params.id, data as any);
      if (!row) return res.status(404).json({ message: "Commitment not found" });
      res.json(normCommitment(row));
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.delete("/api/commitments/:id", async (req, res) => {
    try {
      await storage.deleteCommitment(req.params.id);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  app.post("/api/reset", async (req, res) => {
    try {
      await db.delete(schema.commitments).where(eq(schema.commitments.user_id, DEFAULT_USER_ID));
      await db.delete(schema.savingsTransactions).where(eq(schema.savingsTransactions.user_id, DEFAULT_USER_ID));
      await db.delete(schema.savingsWallets).where(eq(schema.savingsWallets.user_id, DEFAULT_USER_ID));
      await db.delete(schema.transfers).where(eq(schema.transfers.user_id, DEFAULT_USER_ID));
      await db.delete(schema.transactions).where(eq(schema.transactions.user_id, DEFAULT_USER_ID));
      await db.delete(schema.accounts).where(eq(schema.accounts.user_id, DEFAULT_USER_ID));
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ message: errMsg(e) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
