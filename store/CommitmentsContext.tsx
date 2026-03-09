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
import { isWithin29Days, isPastDate, isToday, addMonths, addWeeks, addDays, addYears } from "@/utils/date";

interface CommitmentsContextValue {
  commitments: Commitment[];
  addCommitment: (c: Omit<Commitment, "id" | "created_at" | "updated_at">) => Commitment;
  updateCommitment: (id: string, updates: Partial<Commitment>) => void;
  deleteCommitment: (id: string) => void;
  getCommitment: (id: string) => Commitment | undefined;
  payCommitment: (id: string) => void;
  allocatedMoneyForAccount: (accountId: string) => number;
  upcomingCommitments: Commitment[];
  isLoaded: boolean;
}

const CommitmentsContext = createContext<CommitmentsContextValue | null>(null);

function deriveStatus(dueDate: string): CommitmentStatus {
  if (isToday(dueDate)) return "due_today";
  if (isPastDate(dueDate)) return "overdue";
  return "upcoming";
}

function getNextDueDate(dueDate: string, recurrenceType: RecurrenceType): string {
  switch (recurrenceType) {
    case "daily": return addDays(dueDate, 1);
    case "weekly": return addWeeks(dueDate, 1);
    case "monthly": return addMonths(dueDate, 1);
    case "yearly": return addYears(dueDate, 1);
    default: return dueDate;
  }
}

export function CommitmentsProvider({ children }: { children: ReactNode }) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData<Commitment[]>(KEYS.COMMITMENTS).then((saved) => {
      setCommitments(saved || []);
      setIsLoaded(true);
    });
  }, []);

  const persist = (data: Commitment[]) => {
    setCommitments(data);
    saveData(KEYS.COMMITMENTS, data);
  };

  const addCommitment = (c: Omit<Commitment, "id" | "created_at" | "updated_at">) => {
    const status = deriveStatus(c.due_date);
    const newC: Commitment = {
      ...c,
      status: c.status || status,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persist([...commitments, newC]);
    return newC;
  };

  const updateCommitment = (id: string, updates: Partial<Commitment>) => {
    persist(
      commitments.map((c) =>
        c.id === id
          ? { ...c, ...updates, status: updates.due_date ? deriveStatus(updates.due_date) : c.status, updated_at: now() }
          : c
      )
    );
  };

  const deleteCommitment = (id: string) => {
    persist(commitments.filter((c) => c.id !== id));
  };

  const getCommitment = (id: string) => commitments.find((c) => c.id === id);

  const payCommitment = (id: string) => {
    const commitment = commitments.find((c) => c.id === id);
    if (!commitment) return;

    let updated = commitments.map((c) =>
      c.id === id ? { ...c, status: "paid" as CommitmentStatus, paid_at: now(), updated_at: now() } : c
    );

    if (commitment.recurrence_type !== "none") {
      const nextDueDate = getNextDueDate(commitment.due_date, commitment.recurrence_type);
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
    }

    persist(updated);
  };

  const allocatedMoneyForAccount = (accountId: string): number => {
    return commitments
      .filter(
        (c) =>
          c.account_id === accountId &&
          c.status !== "paid" &&
          isWithin29Days(c.due_date)
      )
      .reduce((sum, c) => sum + c.amount, 0);
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
      upcomingCommitments,
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
