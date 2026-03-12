import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate the validation schemas from routes.ts for isolated testing
const createAccountSchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().min(1, "English name is required"),
  type: z.enum(["current", "cash", "travel", "savings_bank", "wallet", "credit", "investment"]),
  balance: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().default("0"),
  currency: z.string().min(1).max(10).default("QAR"),
  color: z.string().max(20).default("#10B981"),
  icon: z.string().max(50).default("wallet"),
  is_active: z.boolean().default(true),
});

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

const createCommitmentSchema = z.object({
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
  parent_commitment_id: z.string().nullable().optional(),
});

describe("Validation Schemas", () => {
  describe("createAccountSchema", () => {
    it("should accept valid account with all fields", () => {
      const result = createAccountSchema.parse({
        name_ar: "حساب جاري",
        name_en: "Current Account",
        type: "current",
        balance: "1000.500",
        currency: "QAR",
      });
      expect(result.name_ar).toBe("حساب جاري");
      expect(result.balance).toBe("1000.500");
    });

    it("should apply defaults for optional fields", () => {
      const result = createAccountSchema.parse({
        name_ar: "نقد",
        name_en: "Cash",
        type: "cash",
      });
      expect(result.balance).toBe("0");
      expect(result.currency).toBe("QAR");
      expect(result.color).toBe("#10B981");
      expect(result.icon).toBe("wallet");
      expect(result.is_active).toBe(true);
    });

    it("should accept numeric balance and convert to string", () => {
      const result = createAccountSchema.parse({
        name_ar: "حساب",
        name_en: "Account",
        type: "wallet",
        balance: 500.25,
      });
      expect(result.balance).toBe("500.25");
    });

    it("should reject invalid account type", () => {
      expect(() => createAccountSchema.parse({
        name_ar: "حساب",
        name_en: "Account",
        type: "invalid_type",
      })).toThrow();
    });

    it("should reject empty name", () => {
      expect(() => createAccountSchema.parse({
        name_ar: "",
        name_en: "Account",
        type: "current",
      })).toThrow();
    });
  });

  describe("createTransactionSchema", () => {
    it("should accept valid transaction", () => {
      const result = createTransactionSchema.parse({
        account_id: "acc-123",
        type: "expense",
        amount: "50.000",
        date: "2024-01-15T00:00:00.000Z",
      });
      expect(result.account_id).toBe("acc-123");
      expect(result.amount).toBe("50.000");
    });

    it("should reject missing account_id", () => {
      expect(() => createTransactionSchema.parse({
        type: "income",
        amount: 100,
      })).toThrow();
    });

    it("should reject invalid transaction type", () => {
      expect(() => createTransactionSchema.parse({
        account_id: "acc-123",
        type: "transfer",
        amount: 100,
      })).toThrow();
    });

    it("should handle nullable category_id", () => {
      const result = createTransactionSchema.parse({
        account_id: "acc-123",
        type: "expense",
        amount: 50,
        category_id: null,
      });
      expect(result.category_id).toBeNull();
    });
  });

  describe("createTransferSchema", () => {
    it("should accept valid transfer", () => {
      const result = createTransferSchema.parse({
        source_account_id: "acc-1",
        destination_account_id: "acc-2",
        source_amount: 100,
        destination_amount: 100,
      });
      expect(result.source_account_id).toBe("acc-1");
      expect(result.exchange_rate).toBe("1");
    });

    it("should reject same source and destination", () => {
      expect(() => createTransferSchema.parse({
        source_account_id: "acc-1",
        destination_account_id: "acc-1",
        source_amount: 100,
        destination_amount: 100,
      })).toThrow("Source and destination accounts must be different");
    });

    it("should reject empty account IDs", () => {
      expect(() => createTransferSchema.parse({
        source_account_id: "",
        destination_account_id: "acc-2",
        source_amount: 100,
        destination_amount: 100,
      })).toThrow();
    });
  });

  describe("createCommitmentSchema", () => {
    it("should accept valid commitment", () => {
      const result = createCommitmentSchema.parse({
        account_id: "acc-123",
        name_ar: "إيجار",
        name_en: "Rent",
        amount: 5000,
        due_date: "2024-02-01T00:00:00.000Z",
      });
      expect(result.name_en).toBe("Rent");
      expect(result.status).toBe("upcoming");
      expect(result.recurrence_type).toBe("monthly");
    });

    it("should reject missing required fields", () => {
      expect(() => createCommitmentSchema.parse({
        account_id: "acc-123",
        name_ar: "إيجار",
        // missing name_en, amount, due_date
      })).toThrow();
    });

    it("should accept all status values", () => {
      for (const status of ["upcoming", "due_today", "overdue", "paid"]) {
        const result = createCommitmentSchema.parse({
          account_id: "acc-123",
          name_ar: "فاتورة",
          name_en: "Bill",
          amount: 100,
          due_date: "2024-01-01",
          status,
        });
        expect(result.status).toBe(status);
      }
    });
  });
});
