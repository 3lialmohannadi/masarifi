import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_USER_ID = "default-user";

function toIso(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Date) return d.toISOString();
  return d;
}

function toIsoOrNull(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return d;
}

function toDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  return new Date(val);
}

function normAccount(a: any) {
  return {
    ...a,
    balance: typeof a.balance === "string" ? parseFloat(a.balance) : (a.balance ?? 0),
    created_at: toIso(a.created_at),
    updated_at: toIso(a.updated_at),
  };
}

function normTransaction(t: any) {
  return {
    ...t,
    amount: typeof t.amount === "string" ? parseFloat(t.amount) : (t.amount ?? 0),
    date: toIso(t.date),
    created_at: toIso(t.created_at),
    updated_at: toIso(t.updated_at),
  };
}

function normTransfer(t: any) {
  return {
    ...t,
    source_amount: typeof t.source_amount === "string" ? parseFloat(t.source_amount) : (t.source_amount ?? 0),
    destination_amount: typeof t.destination_amount === "string" ? parseFloat(t.destination_amount) : (t.destination_amount ?? 0),
    exchange_rate: typeof t.exchange_rate === "string" ? parseFloat(t.exchange_rate) : (t.exchange_rate ?? 1),
    date: toIso(t.date),
    created_at: toIso(t.created_at),
  };
}

function normSavingsWallet(w: any) {
  return {
    ...w,
    current_amount: typeof w.current_amount === "string" ? parseFloat(w.current_amount) : (w.current_amount ?? 0),
    target_amount: w.target_amount != null ? (typeof w.target_amount === "string" ? parseFloat(w.target_amount) : w.target_amount) : undefined,
    target_date: toIsoOrNull(w.target_date),
    created_at: toIso(w.created_at),
    updated_at: toIso(w.updated_at),
  };
}

function normSavingsTx(t: any) {
  return {
    ...t,
    amount: typeof t.amount === "string" ? parseFloat(t.amount) : (t.amount ?? 0),
    date: toIso(t.date),
    created_at: toIso(t.created_at),
  };
}

function normPlan(p: any) {
  return {
    ...p,
    total_budget: typeof p.total_budget === "string" ? parseFloat(p.total_budget) : (p.total_budget ?? 0),
    start_date: toIso(p.start_date),
    end_date: toIso(p.end_date),
    created_at: toIso(p.created_at),
    updated_at: toIso(p.updated_at),
  };
}

function normPlanCategory(pc: any) {
  return {
    ...pc,
    budget_amount: typeof pc.budget_amount === "string" ? parseFloat(pc.budget_amount) : (pc.budget_amount ?? 0),
    created_at: toIso(pc.created_at),
  };
}

function normCommitment(c: any) {
  return {
    ...c,
    amount: typeof c.amount === "string" ? parseFloat(c.amount) : (c.amount ?? 0),
    due_date: toIso(c.due_date),
    paid_at: toIsoOrNull(c.paid_at),
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at),
  };
}

function normBudget(b: any) {
  return {
    ...b,
    amount: typeof b.amount === "string" ? parseFloat(b.amount) : (b.amount ?? 0),
    created_at: toIso(b.created_at),
    updated_at: toIso(b.updated_at),
  };
}

function normCategory(c: any) {
  return {
    ...c,
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at),
  };
}

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
    const rows = await storage.getAccounts(DEFAULT_USER_ID);
    res.json(rows.map(normAccount));
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID };
      const row = await storage.createAccount(data as any);
      res.json(normAccount(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const row = await storage.updateAccount(req.params.id, rest as any);
      res.json(normAccount(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      await storage.updateAccount(req.params.id, { is_active: false } as any);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Categories ────────────────────────────────────────────────────────────

  app.get("/api/categories", async (_req, res) => {
    const rows = await storage.getCategories(DEFAULT_USER_ID);
    res.json(rows.map(normCategory));
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID };
      const row = await storage.createCategory(data as any);
      res.json(normCategory(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const row = await storage.updateCategory(req.params.id, rest as any);
      res.json(normCategory(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Transactions ──────────────────────────────────────────────────────────

  app.get("/api/transactions", async (_req, res) => {
    const rows = await storage.getTransactions(DEFAULT_USER_ID);
    res.json(rows.map(normTransaction));
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, date: toDate(rest.date) ?? new Date() };
      const row = await storage.createTransaction(data as any);
      res.json(normTransaction(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const data = { ...rest, ...(rest.date ? { date: toDate(rest.date) } : {}) };
      const row = await storage.updateTransaction(req.params.id, data as any);
      res.json(normTransaction(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Transfers ─────────────────────────────────────────────────────────────

  app.get("/api/transfers", async (_req, res) => {
    const rows = await storage.getTransfers(DEFAULT_USER_ID);
    res.json(rows.map(normTransfer));
  });

  app.post("/api/transfers", async (req, res) => {
    try {
      const { id, created_at: _c, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, date: toDate(rest.date) ?? new Date() };
      const row = await storage.createTransfer(data as any);
      res.json(normTransfer(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/transfers/:id", async (req, res) => {
    try {
      await storage.deleteTransfer(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Savings Wallets ───────────────────────────────────────────────────────

  app.get("/api/savings-wallets", async (_req, res) => {
    const rows = await storage.getSavingsWallets(DEFAULT_USER_ID);
    res.json(rows.map(normSavingsWallet));
  });

  app.post("/api/savings-wallets", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, target_date: toDate(rest.target_date) };
      const row = await storage.createSavingsWallet(data as any);
      res.json(normSavingsWallet(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/savings-wallets/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const data = { ...rest, ...(rest.target_date !== undefined ? { target_date: toDate(rest.target_date) } : {}) };
      const row = await storage.updateSavingsWallet(req.params.id, data as any);
      res.json(normSavingsWallet(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/savings-wallets/:id", async (req, res) => {
    try {
      await storage.deleteSavingsWallet(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Savings Transactions ──────────────────────────────────────────────────

  app.get("/api/savings-transactions", async (req, res) => {
    const walletId = req.query.walletId as string | undefined;
    const rows = await storage.getSavingsTransactions(walletId);
    res.json(rows.map(normSavingsTx));
  });

  app.post("/api/savings-transactions", async (req, res) => {
    try {
      const { id, created_at: _c, ...rest } = req.body;
      const data = { ...rest, id, user_id: DEFAULT_USER_ID, date: toDate(rest.date) ?? new Date() };
      const row = await storage.createSavingsTransaction(data as any);
      res.json(normSavingsTx(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/savings-transactions/:id", async (req, res) => {
    try {
      await storage.deleteSavingsTransaction(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Plans ─────────────────────────────────────────────────────────────────

  app.get("/api/plans", async (_req, res) => {
    const rows = await storage.getPlans(DEFAULT_USER_ID);
    res.json(rows.map(normPlan));
  });

  app.post("/api/plans", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const data = {
        ...rest, id, user_id: DEFAULT_USER_ID,
        start_date: toDate(rest.start_date) ?? new Date(),
        end_date: toDate(rest.end_date) ?? new Date(),
      };
      const row = await storage.createPlan(data as any);
      res.json(normPlan(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/plans/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const data = {
        ...rest,
        ...(rest.start_date ? { start_date: toDate(rest.start_date) } : {}),
        ...(rest.end_date ? { end_date: toDate(rest.end_date) } : {}),
      };
      const row = await storage.updatePlan(req.params.id, data as any);
      res.json(normPlan(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/plans/:id", async (req, res) => {
    try {
      await storage.deletePlan(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Plan Categories ───────────────────────────────────────────────────────

  app.get("/api/plan-categories", async (req, res) => {
    const planId = req.query.planId as string | undefined;
    if (planId) {
      const rows = await storage.getPlanCategories(planId);
      res.json(rows.map(normPlanCategory));
    } else {
      const rows = await db.select().from(schema.planCategories);
      res.json(rows.map(normPlanCategory));
    }
  });

  app.post("/api/plan-categories", async (req, res) => {
    try {
      const { id, created_at: _c, ...rest } = req.body;
      const data = { ...rest, id };
      const row = await storage.createPlanCategory(data as any);
      res.json(normPlanCategory(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/plan-categories/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, ...rest } = req.body;
      const row = await storage.updatePlanCategory(req.params.id, rest as any);
      res.json(normPlanCategory(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/plan-categories/:id", async (req, res) => {
    try {
      await storage.deletePlanCategory(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Commitments ───────────────────────────────────────────────────────────

  app.get("/api/commitments", async (_req, res) => {
    const rows = await storage.getCommitments(DEFAULT_USER_ID);
    res.json(rows.map(normCommitment));
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
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.json(normCommitment(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/commitments/:id", async (req, res) => {
    try {
      await storage.deleteCommitment(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Budgets ───────────────────────────────────────────────────────────────

  app.get("/api/budgets", async (_req, res) => {
    const rows = await storage.getBudgets(DEFAULT_USER_ID);
    res.json(rows.map(normBudget));
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const { id, created_at: _c, updated_at: _u, ...rest } = req.body;
      const existing = await storage.getBudgetByCategoryAndMonth(rest.category_id, rest.month);
      if (existing) {
        const row = await storage.updateBudget(existing.id, { amount: rest.amount } as any);
        return res.json(normBudget(row));
      }
      const data = { ...rest, id, user_id: DEFAULT_USER_ID };
      const row = await storage.createBudget(data as any);
      res.json(normBudget(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/budgets/:id", async (req, res) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = req.body;
      const row = await storage.updateBudget(req.params.id, rest as any);
      res.json(normBudget(row));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    try {
      await storage.deleteBudget(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
