import React, { ReactNode, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/store/useStore";
import type { Debt, DebtPayment, DebtStatus } from "@/types";
import { useAuth } from "@/store/AuthContext";
import { apiRequest } from "@/services/api";

export function DebtsProvider({ children }: { children: ReactNode }) {
  const setDebts = useStore((s) => s.setDebts);
  const { user } = useAuth();
  
  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        const res = await apiRequest("GET", "/api/debts");
        const apiData: Debt[] = await res.json();
        if (cancelled) return;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setDebts(apiData);
        }
      } catch {
        // Ignore
      }
    }
    fetchLatest();
    return () => { cancelled = true; };
  }, [user]);

  return <>{children}</>;
}

export function useDebts() {
  const debts = useStore((s) => s.debts);
  const debtPayments = useStore((s) => s.debtPayments);
  const addDebt = useStore((s) => s.addDebt);
  const updateDebtNative = useStore((s) => s.updateDebt);
  const deleteDebt = useStore((s) => s.deleteDebt);
  const addDebtPaymentBase = useStore((s) => s.addDebtPayment);
  const deleteDebtPaymentBase = useStore((s) => s.deleteDebtPayment);
  const isLoaded = useStore((s) => s.isLoaded);

  const getDebt = useCallback((id: string) => debts.find((d) => d.id === id), [debts]);

  const updateDebt = useCallback((id: string, updates: Partial<Omit<Debt, "id" | "created_at">>) => {
    updateDebtNative(id, updates);
  }, [updateDebtNative]);

  const addPayment = useCallback((p: Omit<DebtPayment, "id" | "created_at">): DebtPayment => {
    const newPayment = addDebtPaymentBase(p);
    
    const debt = debts.find((d) => d.id === p.debt_id);
    if (debt) {
      const newPaidAmount = Number(debt.paid_amount) + Number(p.amount);
      const newRemainingAmount = Math.max(0, Number(debt.original_amount) - newPaidAmount);
      const newCompletedInstallments = debt.is_installment_based
        ? debt.completed_installments + 1
        : debt.completed_installments;
      const newStatus: DebtStatus = newRemainingAmount <= 0 ? "completed" : debt.status;

      updateDebtNative(debt.id, {
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        completed_installments: newCompletedInstallments,
        status: newStatus,
      });
    }

    return newPayment;
  }, [debts, addDebtPaymentBase, updateDebtNative]);

  const deletePayment = useCallback((id: string, debtId: string) => {
    const payment = debtPayments.find((p) => p.id === id);
    if (!payment) return;

    deleteDebtPaymentBase(id);

    const debt = debts.find((d) => d.id === debtId);
    if (debt) {
      const newPaidAmount = Math.max(0, Number(debt.paid_amount) - Number(payment.amount));
      const newRemainingAmount = Number(debt.original_amount) - newPaidAmount;
      const newCompletedInstallments = debt.is_installment_based
        ? Math.max(0, debt.completed_installments - 1)
        : debt.completed_installments;
      const newStatus: DebtStatus = newRemainingAmount > 0 && debt.status === "completed" ? "active" : debt.status;

      updateDebtNative(debt.id, {
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        completed_installments: newCompletedInstallments,
        status: newStatus,
      });
    }
  }, [debts, debtPayments, deleteDebtPaymentBase, updateDebtNative]);

  const getPaymentsForDebt = useCallback(
    (debtId: string) => debtPayments.filter((p) => p.debt_id === debtId),
    [debtPayments]
  );

  const { totalOriginal, totalPaid, totalRemaining, activeDebts } = useMemo(() => {
    const active = debts.filter((d) => d.status !== "completed" && d.status !== "cancelled");
    return {
      totalOriginal: debts.reduce((s, d) => s + Number(d.original_amount), 0),
      totalPaid: debts.reduce((s, d) => s + Number(d.paid_amount), 0),
      totalRemaining: debts.reduce((s, d) => s + Number(d.remaining_amount), 0),
      activeDebts: active,
    };
  }, [debts]);

  return {
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
    clearAll: () => {},
    isLoaded,
  };
}
