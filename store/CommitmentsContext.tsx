import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import type { Commitment, CommitmentStatus } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { isReservedOn28th, isPastDate, isToday } from "@/utils/date";
import { apiRequest } from "@/services/api";

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
  clearAll: () => void;
  isLoaded: boolean;
}

const CommitmentsContext = createContext<CommitmentsContextValue | null>(null);

export function deriveStatus(dueDate: string): CommitmentStatus {
  if (isToday(dueDate)) return "due_today";
  if (isPastDate(dueDate)) return "overdue";
  return "upcoming";
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
    async function hydrate() {
      const local = await loadData<Commitment[]>(KEYS.COMMITMENTS) || [];
      if (local.length > 0) {
        const refreshed = refreshCommitmentStatuses(local);
        setCommitments(refreshed);
        setIsLoaded(true);
        apiRequest("GET", "/api/commitments")
          .then((r) => r.json())
          .then((apiData: Commitment[]) => {
            if (Array.isArray(apiData)) {
              const serverMap = new Map(apiData.map((c) => [c.id, c]));
              const localIds = new Set(refreshed.map((c) => c.id));
              refreshed.forEach((c) => {
                const onServer = serverMap.get(c.id);
                if (!onServer) {
                  apiRequest("POST", "/api/commitments", c).catch(() => {});
                } else if (onServer.updated_at !== c.updated_at) {
                  apiRequest("PATCH", `/api/commitments/${c.id}`, c).catch(() => {});
                }
              });
              apiData.filter((c) => !localIds.has(c.id)).forEach((c) =>
                apiRequest("DELETE", `/api/commitments/${c.id}`).catch(() => {})
              );
            }
          })
          .catch(() => {});
      } else {
        try {
          const res = await apiRequest("GET", "/api/commitments");
          const apiData: Commitment[] = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            const refreshed = refreshCommitmentStatuses(apiData);
            setCommitments(refreshed);
            saveData(KEYS.COMMITMENTS, refreshed);
          }
        } catch {
          // server unavailable — start with empty state
        }
        setIsLoaded(true);
      }
    }
    hydrate();
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
    const updated = commitments.map((c) =>
      c.id === id ? { ...c, status: "paid" as CommitmentStatus, paid_at: now(), updated_at: now() } : c
    );
    persist(updated);
    const paidRecord = updated.find((c) => c.id === id);
    if (paidRecord) apiRequest("PATCH", `/api/commitments/${id}`, paidRecord).catch(console.error);
  };

  /**
   * Returns the total amount reserved for unpaid commitments on the given account.
   * Subtracted from the account balance to compute the "available" funds shown
   * on the dashboard. Includes ALL non-paid commitments (upcoming, due today, overdue).
   */
  const allocatedMoneyForAccount = useCallback((accountId: string): number => {
    return commitments
      .filter((c) => c.account_id === accountId && c.status !== "paid")
      .reduce((sum, c) => sum + c.amount, 0);
  }, [commitments]);

  /**
   * Returns committed money that must be excluded from the daily spending limit.
   * Stricter than allocatedMoneyForAccount — only includes urgent items:
   * - Overdue or due today (must be paid immediately)
   * - Upcoming commitments reserved early via the 28th-day rule (see isReservedOn28th)
   */
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

  const refreshStatuses = () => {
    const refreshed = refreshCommitmentStatuses(commitments);
    persist(refreshed);

    // Sync only the commitments whose status actually changed (compare by ID, not index)
    const previousStatusById = new Map(commitments.map((c) => [c.id, c.status]));
    refreshed
      .filter((c) => c.status !== previousStatusById.get(c.id))
      .forEach((c) => apiRequest("PATCH", `/api/commitments/${c.id}`, c).catch(console.error));
  };

  const upcomingCommitments = useMemo(
    () =>
      commitments
        .filter((c) => c.status !== "paid")
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    [commitments]
  );

  const clearAll = () => {
    persist([]);
  };

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
      clearAll,
      isLoaded,
    }),
    [commitments, isLoaded, allocatedMoneyForAccount, reservedMoneyForDailyLimit, upcomingCommitments]
  );

  return <CommitmentsContext.Provider value={value}>{children}</CommitmentsContext.Provider>;
}

export function useCommitments() {
  const ctx = useContext(CommitmentsContext);
  if (!ctx) throw new Error("useCommitments must be used within CommitmentsProvider");
  return ctx;
}
