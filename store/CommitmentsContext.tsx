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
import { useAuth } from "@/store/AuthContext";

const GUEST_ID = "guest";

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
  const { user } = useAuth();
  const userId = user?.id || GUEST_ID;

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCommitments([]);
    setIsLoaded(false);
    let cancelled = false;
    const storageKey = `${KEYS.COMMITMENTS}_${userId}`;

    async function hydrate() {
      const local = await loadData<Commitment[]>(storageKey) || [];
      if (cancelled) return;
      if (local.length > 0) {
        const refreshed = refreshCommitmentStatuses(local);
        setCommitments(refreshed);
        setIsLoaded(true);
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const res = await apiRequest("GET", "/api/commitments");
            const apiData: Commitment[] = await res.json();
            if (cancelled) return;
            if (Array.isArray(apiData)) {
              const refreshedApi = refreshCommitmentStatuses(apiData);
              setCommitments(refreshedApi);
              saveData(storageKey, refreshedApi);
            }
          } catch { /* keep local */ }
        }, 3000);
      } else {
        try {
          const res = await apiRequest("GET", "/api/commitments");
          const apiData: Commitment[] = await res.json();
          if (cancelled) return;
          if (Array.isArray(apiData) && apiData.length > 0) {
            const refreshed = refreshCommitmentStatuses(apiData);
            setCommitments(refreshed);
            saveData(storageKey, refreshed);
          }
        } catch {
          // server unavailable — start with empty state
        }
        if (!cancelled) setIsLoaded(true);
      }
    }
    hydrate();
    return () => { cancelled = true; };
  }, [userId]);

  const storageKey = `${KEYS.COMMITMENTS}_${userId}`;

  const persist = (data: Commitment[]) => {
    setCommitments(data);
    saveData(storageKey, data);
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
    apiRequest("POST", "/api/commitments", newC).catch((e: unknown) => console.warn("[Sync]", e));
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
    if (record) apiRequest("PATCH", `/api/commitments/${id}`, record).catch((e: unknown) => console.warn("[Sync]", e));
  };

  const deleteCommitment = (id: string) => {
    persist(commitments.filter((c) => c.id !== id));
    apiRequest("DELETE", `/api/commitments/${id}`).catch((e: unknown) => console.warn("[Sync]", e));
  };

  const getCommitment = (id: string) => commitments.find((c) => c.id === id);

  const payCommitment = (id: string) => {
    const updated = commitments.map((c) =>
      c.id === id ? { ...c, status: "paid" as CommitmentStatus, paid_at: now(), updated_at: now() } : c
    );
    persist(updated);
    const paidRecord = updated.find((c) => c.id === id);
    if (paidRecord) apiRequest("PATCH", `/api/commitments/${id}`, paidRecord).catch((e: unknown) => console.warn("[Sync]", e));
  };

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

  const refreshStatuses = () => {
    const refreshed = refreshCommitmentStatuses(commitments);
    persist(refreshed);
    const previousStatusById = new Map(commitments.map((c) => [c.id, c.status]));
    refreshed
      .filter((c) => c.status !== previousStatusById.get(c.id))
      .forEach((c) => apiRequest("PATCH", `/api/commitments/${c.id}`, c).catch((e: unknown) => console.warn("[Sync]", e)));
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
    [commitments, isLoaded, allocatedMoneyForAccount, reservedMoneyForDailyLimit, upcomingCommitments] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <CommitmentsContext.Provider value={value}>{children}</CommitmentsContext.Provider>;
}

export function useCommitments() {
  const ctx = useContext(CommitmentsContext);
  if (!ctx) throw new Error("useCommitments must be used within CommitmentsProvider");
  return ctx;
}
