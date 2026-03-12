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
import { createSyncFn } from "@/utils/syncHelper";

interface AccountsContextValue {
  accounts: Account[];
  syncError: string | null;
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
  const [syncError, setSyncError] = useState<string | null>(null);
  const sync = createSyncFn((msg) => setSyncError(msg));

  useEffect(() => {
    async function hydrate() {
      const local = await loadData<Account[]>(KEYS.ACCOUNTS) || [];
      if (local.length > 0) {
        setAccounts(local);
        setIsLoaded(true);
        apiRequest("GET", "/api/accounts")
          .then((r) => r.json())
          .then((apiData: Account[]) => {
            if (Array.isArray(apiData)) {
              const serverMap = new Map(apiData.map((a) => [a.id, a]));
              const localIds = new Set(local.map((a) => a.id));
              local.forEach((a) => {
                const onServer = serverMap.get(a.id);
                if (!onServer) {
                  apiRequest("POST", "/api/accounts", a).catch(() => {});
                } else if (onServer.updated_at !== a.updated_at) {
                  apiRequest("PATCH", `/api/accounts/${a.id}`, a).catch(() => {});
                }
              });
              apiData.filter((a) => !localIds.has(a.id)).forEach((a) =>
                apiRequest("DELETE", `/api/accounts/${a.id}`).catch(() => {})
              );
            }
          })
          .catch(() => {});
      } else {
        try {
          const res = await apiRequest("GET", "/api/accounts");
          const apiData: Account[] = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            setAccounts(apiData);
            saveData(KEYS.ACCOUNTS, apiData);
          }
        } catch {
          // server unavailable — start with empty state
        }
        setIsLoaded(true);
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
    sync(apiRequest("POST", "/api/accounts", newAccount), "create account");
    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, ...updates, updated_at: now() } : a
    );
    persist(updated);
    const record = updated.find((a) => a.id === id);
    if (record) sync(apiRequest("PATCH", `/api/accounts/${id}`, record), "update account");
  };

  const deleteAccount = (id: string) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, is_active: false, updated_at: now() } : a
    );
    persist(updated);
    sync(apiRequest("DELETE", `/api/accounts/${id}`), "delete account");
  };

  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  const updateBalance = (id: string, delta: number) => {
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, balance: a.balance + delta, updated_at: now() } : a
    );
    persist(updated);
    const record = updated.find((a) => a.id === id);
    if (record) sync(apiRequest("PATCH", `/api/accounts/${id}`, record), "update balance");
  };

  const clearAll = () => {
    persist([]);
  };

  const value = useMemo(
    () => ({ accounts, addAccount, updateAccount, deleteAccount, getAccount, updateBalance, clearAll, isLoaded, syncError }),
    [accounts, isLoaded, syncError]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountsProvider");
  return ctx;
}
