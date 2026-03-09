import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import type { Language, ThemeMode, DailyLimitMode, AppSettings } from "@/types";
import { LightTheme, DarkTheme, type Theme } from "@/constants/colors";
import { getTranslations, type TranslationKeys } from "@/i18n";
import { loadData, saveData, KEYS } from "@/utils/storage";

const DEFAULT_SETTINGS: AppSettings = {
  language: "ar",
  theme: "auto",
  daily_limit_mode: "smart",
  manual_daily_limit: 0,
  selected_account_id: "",
  last_used_category_id: "",
  last_used_expense_category_id: "",
  last_used_income_category_id: "",
  onboarded: false,
  notification_enabled: true,
  default_currency: "QAR",
};

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorScheme: ThemeMode;
  setColorScheme: (mode: ThemeMode) => void;
  theme: Theme;
  isDark: boolean;
  t: TranslationKeys;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  isRTL: boolean;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData<AppSettings>(KEYS.SETTINGS).then((saved) => {
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...saved });
      }
      setIsLoaded(true);
    });
  }, []);

  const isDark = useMemo(() => {
    if (settings.theme === "auto") return systemColorScheme === "dark";
    return settings.theme === "dark";
  }, [settings.theme, systemColorScheme]);

  const theme = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);
  const t = useMemo(() => getTranslations(settings.language), [settings.language]);
  const isRTL = settings.language === "ar";

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveData(KEYS.SETTINGS, next);
      return next;
    });
  };

  const setLanguage = (lang: Language) => updateSettings({ language: lang });
  const setThemeMode = (mode: ThemeMode) => updateSettings({ theme: mode });
  const setColorScheme = (mode: ThemeMode) => updateSettings({ theme: mode });
  const setSelectedAccountId = (id: string) => updateSettings({ selected_account_id: id });

  const value = useMemo(
    () => ({
      language: settings.language,
      setLanguage,
      themeMode: settings.theme,
      setThemeMode,
      colorScheme: settings.theme,
      setColorScheme,
      theme,
      isDark,
      t,
      settings,
      updateSettings,
      selectedAccountId: settings.selected_account_id,
      setSelectedAccountId,
      isRTL,
      isLoaded,
    }),
    [settings, theme, isDark, t, isRTL, isLoaded]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
