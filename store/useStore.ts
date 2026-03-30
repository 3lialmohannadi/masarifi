import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId, now } from "@/utils/id";
import { apiRequest } from "@/services/api";
import type {
  Account,
  Transaction,
  Transfer,
  Commitment,
  CommitmentStatus,
  Category,
  SavingsWallet,
  SavingsTransaction,
  Debt,
  DebtPayment,
  Budget,
} from "@/types";

export interface SyncJob {
  id: string;
  method: string;
  url: string;
  data?: any;
}

export interface AppState {
  // Sync Queue
  syncQueue: SyncJob[];
  isSyncing: boolean;
  addSyncJob: (method: string, url: string, data?: any) => void;
  processSyncQueue: () => Promise<void>;

  // Common flags
  isLoaded: boolean;
  setIsLoaded: (v: boolean) => void;
  clearAll: () => void;

  // Accounts
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Omit<Account, "id" | "created_at" | "updated_at">) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  updateBalance: (id: string, delta: number) => void;

  // Transactions & Transfers
  transactions: Transaction[];
  transfers: Transfer[];
  setTransactions: (t: Transaction[]) => void;
  setTransfers: (t: Transfer[]) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "created_at" | "updated_at">) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addTransfer: (tf: Omit<Transfer, "id" | "created_at">) => Transfer;
  deleteTransfer: (id: string) => void;

  // Commitments
  commitments: Commitment[];
  setCommitments: (c: Commitment[]) => void;
  addCommitment: (c: Omit<Commitment, "id" | "created_at" | "updated_at" | "status">, status: CommitmentStatus) => Commitment;
  updateCommitment: (id: string, updates: Partial<Omit<Commitment, "status">>, deriveStatusFn: (date: string) => CommitmentStatus) => void;
  deleteCommitment: (id: string) => void;
  payCommitment: (id: string) => void;

  // Categories
  categories: Category[];
  setCategories: (c: Category[]) => void;
  addCategory: (c: Omit<Category, "id" | "created_at" | "updated_at">) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  toggleFavoriteCategory: (id: string) => void;

  // Savings
  wallets: SavingsWallet[];
  savingsTransactions: SavingsTransaction[];
  setWallets: (w: SavingsWallet[]) => void;
  setSavingsTransactions: (st: SavingsTransaction[]) => void;
  addWallet: (w: Omit<SavingsWallet, "id" | "created_at" | "updated_at">) => SavingsWallet;
  updateWallet: (id: string, updates: Partial<SavingsWallet>) => void;
  deleteWallet: (id: string) => void;
  addSavingsTransaction: (t: Omit<SavingsTransaction, "id" | "created_at">) => SavingsTransaction;

  // Debts
  debts: Debt[];
  debtPayments: DebtPayment[];
  setDebts: (d: Debt[]) => void;
  setDebtPayments: (dp: DebtPayment[]) => void;
  addDebt: (d: Omit<Debt, "id" | "created_at" | "updated_at">) => Debt;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (dp: Omit<DebtPayment, "id" | "created_at">) => DebtPayment;
  deleteDebtPayment: (id: string) => void;

  // Budgets
  budgets: Budget[];
  setBudgets: (b: Budget[]) => void;
  addBudget: (b: Omit<Budget, "id" | "created_at" | "updated_at">) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // INITIAL STATE
      syncQueue: [],
      isSyncing: false,
      isLoaded: true,
      accounts: [],
      transactions: [],
      transfers: [],
      commitments: [],
      categories: [],
      wallets: [],
      savingsTransactions: [],
      debts: [],
      debtPayments: [],
      budgets: [],

      setIsLoaded: (v) => set({ isLoaded: v }),
      clearAll: () =>
        set({
          accounts: [],
          transactions: [],
          transfers: [],
          commitments: [],
          categories: [],
          wallets: [],
          savingsTransactions: [],
          debts: [],
          debtPayments: [],
          budgets: [],
        }),

      // SYNC QUEUE LOGIC
      addSyncJob: (method: string, url: string, data?: any) => {
        set((state) => ({
          syncQueue: [...state.syncQueue, { id: generateId(), method, url, data }],
        }));
        get().processSyncQueue();
      },

      processSyncQueue: async () => {
        const { syncQueue, isSyncing } = get();
        if (isSyncing || syncQueue.length === 0) return;

        set({ isSyncing: true });

        const queue = [...get().syncQueue];
        const remainingQueue = [...queue];

        for (const job of queue) {
          try {
            await apiRequest(job.method, job.url, job.data);
            // On success, remove from queue
            remainingQueue.shift();
            set({ syncQueue: [...remainingQueue] });
          } catch (error: any) {
            // Stop processing if network error, will try again later
            console.warn("[SyncQueue] Error processing job", job.id, error?.message);
            break;
          }
        }

        set({ isSyncing: false });
      },

      // ACCOUNTS
      setAccounts: (accounts) => set({ accounts }),
      addAccount: (account) => {
        const newAccount = { ...account, id: generateId(), created_at: now(), updated_at: now() } as Account;
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
        get().addSyncJob("POST", "/api/accounts", newAccount);
        return newAccount;
      },
      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates, updated_at: now() } : a)),
        }));
        const record = get().accounts.find((a) => a.id === id);
        if (record) get().addSyncJob("PATCH", `/api/accounts/${id}`, record);
      },
      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, is_active: false, updated_at: now() } : a)),
        }));
        get().addSyncJob("DELETE", `/api/accounts/${id}`);
      },
      updateBalance: (id, delta) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, balance: Number(a.balance) + delta, updated_at: now() } : a)),
        }));
        const record = get().accounts.find((a) => a.id === id);
        if (record) get().addSyncJob("PATCH", `/api/accounts/${id}`, record);
      },

      // TRANSACTIONS & TRANSFERS
      setTransactions: (transactions) => set({ transactions }),
      setTransfers: (transfers) => set({ transfers }),
      addTransaction: (tx) => {
        const newTx = { ...tx, id: generateId(), created_at: now(), updated_at: now() } as Transaction;
        set((state) => ({ transactions: [...state.transactions, newTx] }));
        get().addSyncJob("POST", "/api/transactions", newTx);
        return newTx;
      },
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates, updated_at: now() } : t)),
        }));
        const record = get().transactions.find((t) => t.id === id);
        if (record) get().addSyncJob("PATCH", `/api/transactions/${id}`, record);
      },
      deleteTransaction: (id) => {
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
        get().addSyncJob("DELETE", `/api/transactions/${id}`);
      },
      addTransfer: (tf) => {
        const newTf = { ...tf, id: generateId(), created_at: now() } as Transfer;
        set((state) => ({ transfers: [...state.transfers, newTf] }));
        get().addSyncJob("POST", "/api/transfers", newTf);
        return newTf;
      },
      deleteTransfer: (id) => {
        set((state) => ({ transfers: state.transfers.filter((t) => t.id !== id) }));
        get().addSyncJob("DELETE", `/api/transfers/${id}`);
      },

      // COMMITMENTS
      setCommitments: (commitments) => set({ commitments }),
      addCommitment: (c, status) => {
        const newC = { ...c, status, id: generateId(), created_at: now(), updated_at: now() } as Commitment;
        set((state) => ({ commitments: [...state.commitments, newC] }));
        get().addSyncJob("POST", "/api/commitments", newC);
        return newC;
      },
      updateCommitment: (id, updates, deriveStatusFn) => {
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...updates,
                  status: c.status === "paid" ? "paid" : deriveStatusFn((updates.due_date as string) || c.due_date),
                  updated_at: now(),
                }
              : c
          ),
        }));
        const record = get().commitments.find((c) => c.id === id);
        if (record) get().addSyncJob("PATCH", `/api/commitments/${id}`, record);
      },
      deleteCommitment: (id) => {
        set((state) => ({ commitments: state.commitments.filter((c) => c.id !== id) }));
        get().addSyncJob("DELETE", `/api/commitments/${id}`);
      },
      payCommitment: (id) => {
        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === id ? { ...c, status: "paid", paid_at: now(), updated_at: now() } : c
          ),
        }));
        const record = get().commitments.find((c) => c.id === id);
        if (record) get().addSyncJob("PATCH", `/api/commitments/${id}`, record);
      },

      // CATEGORIES
      setCategories: (categories) => set({ categories }),
      addCategory: (c) => {
        const newCat = { ...c, id: generateId(), created_at: now(), updated_at: now() } as Category;
        set((state) => ({ categories: [...state.categories, newCat] }));
        get().addSyncJob("POST", "/api/categories", newCat);
        return newCat;
      },
      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates, updated_at: now() } : c)),
        }));
        const record = get().categories.find((c) => c.id === id);
        if (record) get().addSyncJob("PATCH", `/api/categories/${id}`, record);
      },
      deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
        get().addSyncJob("DELETE", `/api/categories/${id}`);
      },
      toggleFavoriteCategory: (id) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, is_favorite: !c.is_favorite, updated_at: now() } : c)),
        }));
        const record = get().categories.find((c) => c.id === id);
        if (record) get().addSyncJob("PATCH", `/api/categories/${id}`, record);
      },

      // SAVINGS
      setWallets: (wallets) => set({ wallets }),
      setSavingsTransactions: (savingsTransactions) => set({ savingsTransactions }),
      addWallet: (w) => {
        const newW = { ...w, id: generateId(), created_at: now(), updated_at: now() } as SavingsWallet;
        set((state) => ({ wallets: [...state.wallets, newW] }));
        get().addSyncJob("POST", "/api/savings-wallets", newW);
        return newW;
      },
      updateWallet: (id, updates) => {
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates, updated_at: now() } : w)),
        }));
        const record = get().wallets.find((w) => w.id === id);
        if (record) get().addSyncJob("PATCH", `/api/savings-wallets/${id}`, record);
      },
      deleteWallet: (id) => {
        set((state) => ({ wallets: state.wallets.map((w) => (w.id === id ? { ...w, is_archived: true, updated_at: now() } : w)) }));
        const record = get().wallets.find((w) => w.id === id);
        if (record) get().addSyncJob("PATCH", `/api/savings-wallets/${id}`, record);
      },
      addSavingsTransaction: (t) => {
        const newT = { ...t, id: generateId(), created_at: now() } as SavingsTransaction;
        set((state) => ({ savingsTransactions: [...state.savingsTransactions, newT] }));
        get().addSyncJob("POST", "/api/savings-transactions", newT);
        return newT;
      },

      // DEBTS
      setDebts: (debts) => set({ debts }),
      setDebtPayments: (debtPayments) => set({ debtPayments }),
      addDebt: (d) => {
        const newD = { ...d, id: generateId(), created_at: now(), updated_at: now() } as Debt;
        set((state) => ({ debts: [...state.debts, newD] }));
        get().addSyncJob("POST", "/api/debts", newD);
        return newD;
      },
      updateDebt: (id, updates) => {
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? { ...d, ...updates, updated_at: now() } : d)),
        }));
        const record = get().debts.find((d) => d.id === id);
        if (record) get().addSyncJob("PATCH", `/api/debts/${id}`, record);
      },
      deleteDebt: (id) => {
        set((state) => ({ debts: state.debts.filter((d) => d.id !== id) }));
        get().addSyncJob("DELETE", `/api/debts/${id}`);
      },
      addDebtPayment: (dp) => {
        const newDP = { ...dp, id: generateId(), created_at: now() } as DebtPayment;
        set((state) => ({ debtPayments: [...state.debtPayments, newDP] }));
        get().addSyncJob("POST", "/api/debt-payments", newDP);
        return newDP;
      },
      deleteDebtPayment: (id) => {
        set((state) => ({ debtPayments: state.debtPayments.filter((dp) => dp.id !== id) }));
        get().addSyncJob("DELETE", `/api/debt-payments/${id}`);
      },

      // BUDGETS
      setBudgets: (budgets) => set({ budgets }),
      addBudget: (b) => {
        const newB = { ...b, id: generateId(), created_at: now(), updated_at: now() } as Budget;
        set((state) => ({ budgets: [...state.budgets, newB] }));
        get().addSyncJob("POST", "/api/budgets", newB);
        return newB;
      },
      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates, updated_at: now() } : b)),
        }));
        const record = get().budgets.find((b) => b.id === id);
        if (record) get().addSyncJob("PATCH", `/api/budgets/${id}`, record);
      },
      deleteBudget: (id) => {
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
        get().addSyncJob("DELETE", `/api/budgets/${id}`);
      },
    }),
    {
      name: "masarifi-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
