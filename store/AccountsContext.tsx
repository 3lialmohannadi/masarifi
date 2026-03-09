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
    loadData<Account[]>(KEYS.ACCOUNTS).then((saved) => {
      setAccounts(saved || []);
      setIsLoaded(true);
    });
  }, []);

  const persist = (data: Account[]) => {
    setAccounts(data);
    saveData(KEYS.ACCOUNTS, data);
  };

  const addAccount = (account: Omit<Account, "id" | "created_at" | "updated_at">) => {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persist([...accounts, newAccount]);
    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    persist(accounts.map((a) => (a.id === id ? { ...a, ...updates, updated_at: now() } : a)));
  };

  const deleteAccount = (id: string) => {
    persist(accounts.map((a) => (a.id === id ? { ...a, is_active: false, updated_at: now() } : a)));
  };

  const getAccount = (id: string) => accounts.find((a) => a.id === id);

  const updateBalance = (id: string, delta: number) => {
    persist(
      accounts.map((a) =>
        a.id === id ? { ...a, balance: a.balance + delta, updated_at: now() } : a
      )
    );
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
