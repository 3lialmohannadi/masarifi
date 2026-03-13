import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import type { Debt, DebtPayment, DebtStatus } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { apiRequest } from "@/services/api";

interface DebtsContextValue {
  debts: Debt[];
  debtPayments: DebtPayment[];
  addDebt: (d: Omit<Debt, "id" | "created_at" | "updated_at">) => Debt;
  updateDebt: (id: string, updates: Partial<Omit<Debt, "id" | "created_at">>) => void;
  deleteDebt: (id: string) => void;
  getDebt: (id: string) => Debt | undefined;
  addPayment: (p: Omit<DebtPayment, "id" | "created_at">) => DebtPayment;
  deletePayment: (id: string, debtId: string) => void;
  getPaymentsForDebt: (debtId: string) => DebtPayment[];
  totalOriginal: number;
  totalPaid: number;
  totalRemaining: number;
  activeDebts: Debt[];
  clearAll: () => void;
  isLoaded: boolean;
}

const DebtsContext = createContext<DebtsContextValue | null>(null);

function refreshDebtStatuses(list: Debt[]): Debt[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return list.map((d) => {
    if (d.status === "completed") return d;
    if (d.remaining_amount <= 0) return { ...d, status: "completed" as DebtStatus, updated_at: now() };
    if (d.due_date) {
      const due = new Date(d.due_date);
      due.setHours(0, 0, 0, 0);
      if (due < today) return { ...d, status: "overdue" as DebtStatus, updated_at: now() };
    }
    if (d.status !== "active") return { ...d, status: "active" as DebtStatus, updated_at: now() };
    return d;
  });
}

export function DebtsProvider({ children }: { children: ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const localDebts = await loadData<Debt[]>(KEYS.DEBTS) || [];
      const localPayments = await loadData<DebtPayment[]>(KEYS.DEBT_PAYMENTS) || [];

      if (localDebts.length > 0 || localPayments.length > 0) {
        const refreshed = refreshDebtStatuses(localDebts);
        setDebts(refreshed);
        setDebtPayments(localPayments);
        setIsLoaded(true);

        setTimeout(() => {
          apiRequest("GET", "/api/debts")
            .then((r) => r.json())
            .then((apiData: Debt[]) => {
              if (!Array.isArray(apiData)) return;
              const serverMap = new Map(apiData.map((d) => [d.id, d]));
              const localIds = new Set(refreshed.map((d) => d.id));
              refreshed.forEach((d) => {
                const onServer = serverMap.get(d.id);
                if (!onServer) {
                  apiRequest("POST", "/api/debts", d).catch(() => {});
                } else if (onServer.updated_at !== d.updated_at) {
                  apiRequest("PATCH", `/api/debts/${d.id}`, d).catch(() => {});
                }
              });
              apiData.filter((d) => !localIds.has(d.id)).forEach((d) =>
                apiRequest("DELETE", `/api/debts/${d.id}`).catch(() => {})
              );
            })
            .catch(() => {});
        }, 4000);
      } else {
        try {
          const res = await apiRequest("GET", "/api/debts");
          const apiData: Debt[] = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            const refreshed = refreshDebtStatuses(apiData);
            setDebts(refreshed);
            saveData(KEYS.DEBTS, refreshed);
          }
        } catch {
          // server unavailable
        }
        setIsLoaded(true);
      }
    }
    hydrate();
  }, []);

  const persistDebts = (data: Debt[]) => {
    setDebts(data);
    saveData(KEYS.DEBTS, data);
  };

  const persistPayments = (data: DebtPayment[]) => {
    setDebtPayments(data);
    saveData(KEYS.DEBT_PAYMENTS, data);
  };

  const addDebt = useCallback((d: Omit<Debt, "id" | "created_at" | "updated_at">): Debt => {
    const newDebt: Debt = {
      ...d,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    const updated = [newDebt, ...debts];
    persistDebts(updated);
    apiRequest("POST", "/api/debts", newDebt).catch(() => {});
    return newDebt;
  }, [debts]);

  const updateDebt = useCallback((id: string, updates: Partial<Omit<Debt, "id" | "created_at">>) => {
    const updated = debts.map((d) =>
      d.id === id ? { ...d, ...updates, updated_at: now() } : d
    );
    persistDebts(updated);
    const updatedDebt = updated.find((d) => d.id === id);
    if (updatedDebt) apiRequest("PATCH", `/api/debts/${id}`, updatedDebt).catch(() => {});
  }, [debts]);

  const deleteDebt = useCallback((id: string) => {
    const updated = debts.filter((d) => d.id !== id);
    persistDebts(updated);
    const updatedPayments = debtPayments.filter((p) => p.debt_id !== id);
    persistPayments(updatedPayments);
    apiRequest("DELETE", `/api/debts/${id}`).catch(() => {});
  }, [debts, debtPayments]);

  const getDebt = useCallback((id: string) => debts.find((d) => d.id === id), [debts]);

  const addPayment = useCallback((p: Omit<DebtPayment, "id" | "created_at">): DebtPayment => {
    const newPayment: DebtPayment = {
      ...p,
      id: generateId(),
      created_at: now(),
    };

    const updatedPayments = [newPayment, ...debtPayments];
    persistPayments(updatedPayments);

    const debt = debts.find((d) => d.id === p.debt_id);
    if (debt) {
      const newPaidAmount = debt.paid_amount + p.amount;
      const newRemainingAmount = Math.max(0, debt.original_amount - newPaidAmount);
      const newCompletedInstallments = debt.is_installment_based
        ? debt.completed_installments + 1
        : debt.completed_installments;
      const newStatus: DebtStatus = newRemainingAmount <= 0 ? "completed" : debt.status;

      const updatedDebt: Debt = {
        ...debt,
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        completed_installments: newCompletedInstallments,
        status: newStatus,
        updated_at: now(),
      };

      const updatedDebts = debts.map((d) => d.id === debt.id ? updatedDebt : d);
      persistDebts(updatedDebts);
      apiRequest("PATCH", `/api/debts/${debt.id}`, updatedDebt).catch(() => {});
    }

    apiRequest("POST", `/api/debts/${p.debt_id}/payments`, newPayment).catch(() => {});
    return newPayment;
  }, [debts, debtPayments]);

  const deletePayment = useCallback((id: string, debtId: string) => {
    const payment = debtPayments.find((p) => p.id === id);
    if (!payment) return;

    const updatedPayments = debtPayments.filter((p) => p.id !== id);
    persistPayments(updatedPayments);

    const debt = debts.find((d) => d.id === debtId);
    if (debt) {
      const newPaidAmount = Math.max(0, debt.paid_amount - payment.amount);
      const newRemainingAmount = debt.original_amount - newPaidAmount;
      const newCompletedInstallments = debt.is_installment_based
        ? Math.max(0, debt.completed_installments - 1)
        : debt.completed_installments;
      const newStatus: DebtStatus = newRemainingAmount > 0 && debt.status === "completed" ? "active" : debt.status;

      const updatedDebt: Debt = {
        ...debt,
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        completed_installments: newCompletedInstallments,
        status: newStatus,
        updated_at: now(),
      };
      const updatedDebts = debts.map((d) => d.id === debtId ? updatedDebt : d);
      persistDebts(updatedDebts);
      apiRequest("PATCH", `/api/debts/${debtId}`, updatedDebt).catch(() => {});
    }

    apiRequest("DELETE", `/api/debt-payments/${id}`).catch(() => {});
  }, [debts, debtPayments]);

  const getPaymentsForDebt = useCallback(
    (debtId: string) => debtPayments.filter((p) => p.debt_id === debtId),
    [debtPayments]
  );

  const { totalOriginal, totalPaid, totalRemaining, activeDebts } = useMemo(() => {
    const active = debts.filter((d) => d.status !== "completed");
    return {
      totalOriginal: debts.reduce((s, d) => s + d.original_amount, 0),
      totalPaid: debts.reduce((s, d) => s + d.paid_amount, 0),
      totalRemaining: debts.reduce((s, d) => s + d.remaining_amount, 0),
      activeDebts: active,
    };
  }, [debts]);

  const clearAll = useCallback(() => {
    persistDebts([]);
    persistPayments([]);
  }, []);

  const value = useMemo(
    () => ({
      debts,
      debtPayments,
      addDebt,
      updateDebt,
      deleteDebt,
      getDebt,
      addPayment,
      deletePayment,
      getPaymentsForDebt,
      totalOriginal,
      totalPaid,
      totalRemaining,
      activeDebts,
      clearAll,
      isLoaded,
    }),
    [debts, debtPayments, totalOriginal, totalPaid, totalRemaining, activeDebts, isLoaded] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
}

export function useDebts() {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error("useDebts must be used within DebtsProvider");
  return ctx;
}
