import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEYS = {
  SETTINGS: "@masarifi/settings",
  ACCOUNTS: "@masarifi/accounts",
  CATEGORIES: "@masarifi/categories",
  TRANSACTIONS: "@masarifi/transactions",
  TRANSFERS: "@masarifi/transfers",
  SAVINGS_WALLETS: "@masarifi/savings_wallets",
  SAVINGS_TRANSACTIONS: "@masarifi/savings_transactions",
  COMMITMENTS: "@masarifi/commitments",
} as const;

export type StorageKey = typeof KEYS[keyof typeof KEYS];

export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    if (__DEV__) console.error(`[Storage] loadData failed for "${key}":`, error);
    return null;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (__DEV__) console.error(`[Storage] saveData failed for "${key}":`, error);
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    if (__DEV__) console.error(`[Storage] removeData failed for "${key}":`, error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const allKeys = Object.values(KEYS);
    await AsyncStorage.multiRemove(allKeys);
  } catch (error) {
    if (__DEV__) console.error("[Storage] clearAllData failed:", error);
  }
}
