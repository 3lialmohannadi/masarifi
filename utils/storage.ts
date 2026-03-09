import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  SETTINGS: "@masarifi/settings",
  ACCOUNTS: "@masarifi/accounts",
  CATEGORIES: "@masarifi/categories",
  TRANSACTIONS: "@masarifi/transactions",
  TRANSFERS: "@masarifi/transfers",
  SAVINGS_WALLETS: "@masarifi/savings_wallets",
  SAVINGS_TRANSACTIONS: "@masarifi/savings_transactions",
  PLANS: "@masarifi/plans",
  PLAN_CATEGORIES: "@masarifi/plan_categories",
  COMMITMENTS: "@masarifi/commitments",
  BUDGETS: "@masarifi/budgets",
};

export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // silent fail
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silent fail
  }
}

export { KEYS };
