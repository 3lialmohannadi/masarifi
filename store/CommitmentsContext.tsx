import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { Commitment, CommitmentStatus, RecurrenceType } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { isReservedOn28th, isPastDate, isToday, addMonths, addWeeks, addDays, addYears } from "@/utils/date";
import { apiRequest } from "@/lib/query-client";

interface CommitmentsContextValue {
  commitments: Commitment[];
  addCommitment: (c: Omit<Commitment, "id" | "created_at" | "updated_at" | "status">) => Commitment;
  updateCommitment: (id: string, updates: Partial<Omit<Commitment, "status">>) => void;
  deleteCommitment: (id: string) => void;
  getCommitment: (id: string) => Commitment | undefined;
  payCommitment: (id: string) => void;
  allocatedMoneyForAccount: (accountId: string) => number;
  reservedMoneyForDailyLimit: (accountId: string) => number;
  upcomingCommitments: Commitment[];
  refreshStatuses: () => void;
  isLoaded: boolean;
}

const CommitmentsContext = createContext<CommitmentsContextValue | null>(null);

export function deriveStatus(dueDate: string): CommitmentStatus {
  if (isToday(dueDate)) return "due_today";
  if (isPastDate(dueDate)) return "overdue";
  return "upcoming";
}

function advanceOneStep(dateStr: string, recurrenceType: RecurrenceType): string {
  switch (recurrenceType) {
    case "daily":   return addDays(dateStr, 1);
    case "weekly":  return addWeeks(dateStr, 1);
    case "monthly": return addMonths(dateStr, 1);
    case "yearly":  return addYears(dateStr, 1);
    default:        return dateStr;
  }
}

function getNextFutureDueDate(dueDate: string, recurrenceType: RecurrenceType): string {
  let next = dueDate;
  let iterations = 0;
  do {
    next = advanceOneStep(next, recurrenceType);
    iterations++;
  } while (isPastDate(next) && !isToday(next) && iterations < 730);
  return next;
}

function refreshCommitmentStatuses(list: Commitment[]): Commitment[] {
  return list.map((c) => {
    if (c.status === "paid") return c;
    const fresh = deriveStatus(c.due_date);
    if (fresh === c.status) return c;
    return { ...c, status: fresh, updated_at: now() };
  });
}

export function CommitmentsProvider({ children }: { children: ReactNode }) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    apiRequest("GET", "/api/commitments")
      .then((res) => res.json())
      .then(async (apiData: Commitment[]) => {
        if (apiData && apiData.length > 0) {
          const refreshed = refreshCommitmentStatuses(apiData);
          setCommitments(refreshed);
          saveData(KEYS.COMMITMENTS, refreshed);
          refreshed
            .filter((c, i) => c.status !== apiData[i]?.status)
            .forEach((c) =>
              apiRequest("PATCH", `/api/commitments/${c.id}`, c).catch(() => {})
            );
        } else {
          const local = await loadData<Commitment[]>(KEYS.COMMITMENTS);
          if (local && local.length > 0) {
            const refreshed = refreshCommitmentStatuses(local);
            setCommitments(refreshed);
            refreshed.forEach((item) =>
              apiRequest("POST", "/api/commitments", item).catch(() => {})
            );
          }
        }
      })
      .catch(() => {
        loadData<Commitment[]>(KEYS.COMMITMENTS).then((saved) => {
          const refreshed = refreshCommitmentStatuses(saved || []);
          setCommitments(refreshed);
        });
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = (data: Commitment[]) => {
    setCommitments(data);
    saveData(KEYS.COMMITMENTS, data);
  };

  const addCommitment = (c: Omit<Commitment, "id" | "created_at" | "updated_at" | "status">): Commitment => {
    const status = deriveStatus(c.due_date);
    const newC: Commitment = {
      ...c,
      status,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persist([...commitments, newC]);
    apiRequest("POST", "/api/commitments", newC).catch(console.error);
    return newC;
  };

  const updateCommitment = (id: string, updates: Partial<Omit<Commitment, "status">>) => {
    const updated = commitments.map((c) =>
      c.id === id
        ? {
            ...c,
            ...updates,
            status: c.status === "paid" ? ("paid" as CommitmentStatus) : deriveStatus((updates.due_date as string) || c.due_date),
            updated_at: now(),
          }
        : c
    );
    persist(updated);
    const record = updated.find((c) => c.id === id);
    if (record) apiRequest("PATCH", `/api/commitments/${id}`, record).catch(console.error);
  };

  const deleteCommitment = (id: string) => {
    persist(commitments.filter((c) => c.id !== id));
    apiRequest("DELETE", `/api/commitments/${id}`).catch(console.error);
  };

  const getCommitment = (id: string) => commitments.find((c) => c.id === id);

  const payCommitment = (id: string) => {
    const commitment = commitments.find((c) => c.id === id);
    if (!commitment) return;

    let updated = commitments.map((c) =>
      c.id === id ? { ...c, status: "paid" as CommitmentStatus, paid_at: now(), updated_at: now() } : c
    );

    if (commitment.recurrence_type !== "none") {
      const nextDueDate = getNextFutureDueDate(commitment.due_date, commitment.recurrence_type);
      const newCommitment: Commitment = {
        ...commitment,
        id: generateId(),
        due_date: nextDueDate,
        status: deriveStatus(nextDueDate),
        paid_at: undefined,
        parent_commitment_id: commitment.id,
        created_at: now(),
        updated_at: now(),
      };
      updated = [...updated, newCommitment];
      apiRequest("POST", "/api/commitments", newCommitment).catch(console.error);
    }

    persist(updated);
    const paidRecord = updated.find((c) => c.id === id);
    if (paidRecord) apiRequest("PATCH", `/api/commitments/${id}`, paidRecord).catch(console.error);
  };

  const allocatedMoneyForAccount = (accountId: string): number => {
    return commitments
      .filter((c) => c.account_id === accountId && c.status !== "paid")
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const reservedMoneyForDailyLimit = (accountId: string): number => {
    return commitments
      .filter(
        (c) =>
          c.account_id === accountId &&
          c.status !== "paid" &&
          (c.status === "overdue" || c.status === "due_today" || isReservedOn28th(c.due_date))
      )
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const refreshStatuses = () => {
    const refreshed = refreshCommitmentStatuses(commitments);
    persist(refreshed);
    refreshed
      .filter((c, i) => c.status !== commitments[i]?.status)
      .forEach((c) => apiRequest("PATCH", `/api/commitments/${c.id}`, c).catch(console.error));
  };

  const upcomingCommitments = useMemo(
    () =>
      commitments
        .filter((c) => c.status !== "paid")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    [commitments]
  );

  const value = useMemo(
    () => ({
      commitments,
      addCommitment,
      updateCommitment,
      deleteCommitment,
      getCommitment,
      payCommitment,
      allocatedMoneyForAccount,
      reservedMoneyForDailyLimit,
      upcomingCommitments,
      refreshStatuses,
      isLoaded,
    }),
    [commitments, isLoaded]
  );

  return <CommitmentsContext.Provider value={value}>{children}</CommitmentsContext.Provider>;
}

export function useCommitments() {
  const ctx = useContext(CommitmentsContext);
  if (!ctx) throw new Error("useCommitments must be used within CommitmentsProvider");
  return ctx;
}
