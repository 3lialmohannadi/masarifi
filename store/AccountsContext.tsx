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
import { apiRequest } from "@/lib/query-client";

interface AccountsContextValue {
  accounts: Account[];
  addAccount: (account: Omit<Account, "id" | "created_at" | "updated_at">) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getAccount: (id: string) => Account | undefined;
  updateBalance: (id: string, delta: number) => void;
  isLoaded: boolean;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    apiRequest("GET", "/api/accounts")
      .then((res) => res.json())
      .then((apiData: Account[]) => {
        if (apiData && apiData.length > 0) {
          setAccounts(apiData);
          saveData(KEYS.ACCOUNTS, apiData);
        } else {
          loadData<Account[]>(KEYS.ACCOUNTS).then((local) => {
            if (local && local.length > 0) {
              setAccounts(local);
              local.forEach((item) =>
                apiRequest("POST", "/api/accounts", item).catch(() => {})
              );
            }
          });
        }
      })
      .catch(() => {
        loadData<Account[]>(KEYS.ACCOUNTS).then((local) => {
          setAccounts(local || []);
        });
      })
      .finally(() => setIsLoaded(true));
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

  const value = useMemo(
    () => ({ accounts, addAccount, updateAccount, deleteAccount, getAccount, updateBalance, isLoaded }),
    [accounts, isLoaded]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountsProvider");
  return ctx;
}
