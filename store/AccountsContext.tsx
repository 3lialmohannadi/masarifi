import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { Account } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { apiRequest } from "@/services/api";

interface AccountsContextValue {
  accounts: Account[];
  addAccount: (account: Omit<Account, "id" | "created_at" | "updated_at">) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getAccount: (id: string) => Account | undefined;
  updateBalance: (id: string, delta: number) => void;
  clearAll: () => void;
  isLoaded: boolean;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const local = await loadData<Account[]>(KEYS.ACCOUNTS) || [];
      setAccounts(local);
      setIsLoaded(true);
      try {
        const res = await apiRequest("GET", "/api/accounts");
        const apiData: Account[] = await res.json();
        if (Array.isArray(apiData)) {
          const localIds = new Set(local.map((a) => a.id));
          const serverIds = new Set(apiData.map((a) => a.id));
          const serverOnly = apiData.filter((a) => !localIds.has(a.id));
          if (serverOnly.length > 0) {
            const merged = [...local, ...serverOnly];
            setAccounts(merged);
            saveData(KEYS.ACCOUNTS, merged);
          }
          local.filter((a) => !serverIds.has(a.id)).forEach((a) =>
            apiRequest("POST", "/api/accounts", a).catch(() => {})
          );
        }
      } catch {
        // server unavailable — local data already shown
      }
    }
    hydrate();
  }, []);

  const persist = (data: Account[]) => {
    setAccounts(data);
    saveData(KEYS.ACCOUNTS, data);
  };

  const addAccount = (account: Omit<Account, "id" | "created_at" | "updated_at">): Account => {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persist([...accounts, newAccount]);
    apiRequest("POST", "/api/accounts", newAccount).catch(console.error);
    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, ...updates, updated_at: now() } : a
    );
    persist(updated);
    const record = updated.find((a) => a.id === id);
    if (record) apiRequest("PATCH", `/api/accounts/${id}`, record).catch(console.error);
  };

  const deleteAccount = (id: string) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, is_active: false, updated_at: now() } : a
    );
    persist(updated);
    apiRequest("DELETE", `/api/accounts/${id}`).catch(console.error);
  };

  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  const updateBalance = (id: string, delta: number) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, balance: a.balance + delta, updated_at: now() } : a
    );
    persist(updated);
    const record = updated.find((a) => a.id === id);
    if (record) apiRequest("PATCH", `/api/accounts/${id}`, record).catch(console.error);
  };

  const clearAll = () => {
    persist([]);
  };

  const value = useMemo(
    () => ({ accounts, addAccount, updateAccount, deleteAccount, getAccount, updateBalance, clearAll, isLoaded }),
    [accounts, isLoaded]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountsProvider");
  return ctx;
}
