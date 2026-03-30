import React, { ReactNode, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/store/useStore";
import type { Commitment, CommitmentStatus } from "@/types";
import { useAuth } from "@/store/AuthContext";
import { apiRequest } from "@/services/api";
import { isReservedOn28th, isPastDate, isToday } from "@/utils/date";

export function deriveStatus(dueDate: string): CommitmentStatus {
  if (isToday(dueDate)) return "due_today";
  if (isPastDate(dueDate)) return "overdue";
  return "upcoming";
}

export function CommitmentsProvider({ children }: { children: ReactNode }) {
  const setCommitments = useStore((s) => s.setCommitments);
  const { user } = useAuth();
  
  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      try {
        const res = await apiRequest("GET", "/api/commitments");
        const apiData: Commitment[] = await res.json();
        if (cancelled) return;
        if (Array.isArray(apiData) && apiData.length > 0) {
          setCommitments(apiData);
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

export function useCommitments() {
  const commitments = useStore((s) => s.commitments);
  const addCommitmentNative = useStore((s) => s.addCommitment);
  const updateCommitmentNative = useStore((s) => s.updateCommitment);
  const deleteCommitment = useStore((s) => s.deleteCommitment);
  const payCommitment = useStore((s) => s.payCommitment);
  const isLoaded = useStore((s) => s.isLoaded);

  const addCommitment = (c: Omit<Commitment, "id" | "created_at" | "updated_at" | "status">) => {
    return addCommitmentNative(c, deriveStatus(c.due_date));
  };
  
  const updateCommitment = (id: string, updates: Partial<Omit<Commitment, "status">>) => {
    updateCommitmentNative(id, updates, deriveStatus);
  };

  const getCommitment = (id: string) => commitments.find((c) => c.id === id);

  const allocatedMoneyForAccount = useCallback((accountId: string): number => {
    return commitments
      .filter((c) => c.account_id === accountId && c.status !== "paid")
      .reduce((sum, c) => sum + c.amount, 0);
  }, [commitments]);

  const reservedMoneyForDailyLimit = useCallback((accountId: string): number => {
    return commitments
      .filter(
        (c) =>
          c.account_id === accountId &&
          c.status !== "paid" &&
          (c.status === "overdue" || c.status === "due_today" || isReservedOn28th(c.due_date))
      )
      .reduce((sum, c) => sum + c.amount, 0);
  }, [commitments]);

  const upcomingCommitments = useMemo(
    () =>
      commitments
        .filter((c) => c.status !== "paid")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    [commitments]
  );

  return {
    commitments,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    getCommitment,
    payCommitment,
    allocatedMoneyForAccount,
    reservedMoneyForDailyLimit,
    upcomingCommitments,
    refreshStatuses: () => {}, // Handled automatically now or can be added back
    clearAll: () => {},
    isLoaded,
  };
}
