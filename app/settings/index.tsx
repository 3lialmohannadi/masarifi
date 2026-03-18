import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, Switch, Share, Platform, Image, Modal, ActivityIndicator, Linking } from "react-native";
import { buildTransactionsCSV, shareCSV, buildCSVFilename } from "@/utils/export";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { useSavings } from "@/store/SavingsContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { AppButton } from "@/components/ui/AppButton";
import { getProfile, type Profile } from "@/src/lib/profileService";

const CURRENCIES = [
  { code: "QAR", flag: "🇶🇦" },
  { code: "SAR", flag: "🇸🇦" },
  { code: "AED", flag: "🇦🇪" },
  { code: "KWD", flag: "🇰🇼" },
  { code: "BHD", flag: "🇧🇭" },
  { code: "OMR", flag: "🇴🇲" },
  { code: "USD", flag: "🇺🇸" },
  { code: "EUR", flag: "🇪🇺" },
  { code: "GBP", flag: "🇬🇧" },
];

function SectionLabel({ title }: { title: string }) {
  const { theme, isRTL } = useApp();
  return (
    <Text style={{ fontSize: 10, fontWeight: "500", color: theme.textMuted, textAlign: isRTL ? "right" : "left", paddingHorizontal: 4, marginBottom: 4, marginTop: 8 }}>
      {title}
    </Text>
  );
}

function NavRow({ icon, iconColor, label, subtitle, onPress, testID }: {
  icon: string; iconColor: string; label: string; subtitle?: string; onPress: () => void; testID?: string;
}) {
  const { theme, isRTL, isDark } = useApp();
  return (
    <Pressable
      testID={testID}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => ({
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        padding: 14,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        ...(isDark ? {} : Platform.OS === "web"
          ? { boxShadow: "0 2px 8px rgba(47,143,131,0.07)" }
          : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }),
      })}
    >
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: iconColor + "18", alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>{label}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>{subtitle}</Text>}
      </View>
      <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={theme.border} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, setLanguage, themeMode, setThemeMode, settings, updateSettings, isRTL, showToast, isDark } = useApp();
  const { accounts, clearAll: clearAccounts } = useAccounts();
  const { transactions, transfers, clearAll: clearTransactions } = useTransactions();
  const { categories } = useCategories();
  const { wallets: savingsWallets, savingsTransactions, clearAll: clearSavings } = useSavings();
  const { commitments, clearAll: clearCommitments } = useCommitments();
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportCSVDone, setExportCSVDone] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [notifPermission, setNotifPermission] = useState<"granted" | "denied" | "undetermined" | null>(null);

  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile).catch(() => {});
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    import("@/utils/notifications").then(({ getNotificationPermissionStatus }) => {
      getNotificationPermissionStatus().then(setNotifPermission).catch(() => {});
    });
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "?").toUpperCase();

  const LANG_OPTIONS = [
    { code: "ar" as const, label: "العربية" },
    { code: "en" as const, label: "English" },
  ];

  const THEME_OPTIONS = [
    { key: "light" as const, label: t.settings.light, icon: "sun" },
    { key: "dark" as const, label: t.settings.dark, icon: "moon" },
    { key: "auto" as const, label: t.settings.auto, icon: "smartphone" },
  ];

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const exportData = {
        exported_at: new Date().toISOString(),
        version: "1.0.0",
        accounts,
        transactions,
        savings_wallets: savingsWallets,
        savings_transactions: savingsTransactions,
        commitments,
        settings,
      };
      const jsonString = JSON.stringify(exportData, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `masarifi_export_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: jsonString,
          title: `masarifi_export_${new Date().toISOString().split("T")[0]}.json`,
        });
      }

      setExportDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setExportDone(false), 3000);
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setExporting(false);
    }
  }, [accounts, transactions, savingsWallets, savingsTransactions, commitments, settings, showToast, t.toast.error]);

  const handleExportCSV = useCallback(async () => {
    setExportingCSV(true);
    try {
      const csv = buildTransactionsCSV(transactions, transfers, accounts, categories, t, language);
      const filename = buildCSVFilename();
      await shareCSV(csv, filename);
      setExportCSVDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setExportCSVDone(false), 3000);
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setExportingCSV(false);
    }
  }, [transactions, transfers, accounts, categories, t, language, showToast]);

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      const { apiRequest } = await import("@/services/api");
      await apiRequest("POST", "/api/reset", undefined, { "X-Confirm-Reset": "true" });
      clearAccounts();
      clearTransactions();
      clearSavings();
      clearCommitments();
      setShowResetConfirm(false);
      setResetDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setResetDone(false), 3000);
    } catch {
      setShowResetConfirm(false);
      showToast(t.toast.error, "error");
    } finally {
      setResetting(false);
    }
  }, [clearAccounts, clearTransactions, clearSavings, clearCommitments, showToast, t.toast.error]);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const defaultCurr = settings.default_currency || "QAR";
  const selectedCurrencyObj = CURRENCIES.find((c) => c.code === defaultCurr) || CURRENCIES[0];
  const currencyName = (t.currencies as any)[defaultCurr] || defaultCurr;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        paddingTop: topPadding,
        paddingBottom: 14,
        paddingHorizontal: 20,
        backgroundColor: theme.background,
        gap: 12,
      }}>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
            {t.settings.title}
          </Text>
        </View>

        {/* App identity banner */}
        <View style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: theme.card,
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <Image
            source={isDark
              ? (language === "ar" ? require("@/assets/logo_ar_dark.png") : require("@/assets/logo_en_dark.png"))
              : (language === "ar" ? require("@/assets/logo_ar_light.png") : require("@/assets/logo_en_light.png"))
            }
            resizeMode="contain"
            style={{ height: 36, width: 110 }}
          />
          <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start", gap: 2 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.income }} />
              <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "500" }}>{t.settings.version} 1.1.0</Text>
            </View>
            <Text style={{ fontSize: 10, color: theme.textMuted }}>
              {accounts.filter((a) => a.is_active).length} {t.settings.accountsCount}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 6 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* ── 1. Language ── */}
        <SectionLabel title={t.settings.language} />
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10, marginBottom: 8 }}>
          {LANG_OPTIONS.map((opt) => (
            <Pressable
              key={opt.code}
              testID={`lang-${opt.code}`}
              onPress={() => { Haptics.selectionAsync(); setLanguage(opt.code); }}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", gap: 6,
                backgroundColor: language === opt.code ? theme.primary : theme.card,
                borderWidth: 2,
                borderColor: language === opt.code ? theme.primary : theme.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: language === opt.code ? "#fff" : theme.text }}>
                {opt.label}
              </Text>
              {language === opt.code && (
                <View style={{ position: "absolute", top: 8, right: 8 }}>
                  <Feather name="check-circle" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── 2. Account ── */}
        <SectionLabel title={t.auth.account} />

        {user ? (
          /* ── Signed-in: only the profile card ── */
          <View style={{ marginBottom: 8 }}>
            <Pressable
              onPress={() => router.push("/profile")}
              style={({ pressed }) => ({
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 16,
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 14,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: theme.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
                  {initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: theme.text,
                    textAlign: isRTL ? "right" : "left",
                  }}
                  numberOfLines={1}
                >
                  {profile?.full_name || user.email}
                </Text>
                {profile?.full_name ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      textAlign: isRTL ? "right" : "left",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {user.email}
                  </Text>
                ) : null}
              </View>
              <Feather
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={16}
                color={theme.textMuted}
              />
            </Pressable>
          </View>
        ) : (
          /* ── Guest state ── */
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 20,
                gap: 16,
              }}
            >
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: theme.primary + "18",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="user" size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.text,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {t.auth.guestTitle}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {t.auth.guestSubtitle}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {[t.auth.benefit1, t.auth.benefit2, t.auth.benefit3].map(
                  (benefit, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: isRTL ? "row-reverse" : "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: theme.primary + "18",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="check" size={12} color={theme.primary} />
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.textSecondary,
                          flex: 1,
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        {benefit}
                      </Text>
                    </View>
                  )
                )}
              </View>

              <AppButton
                title={t.auth.signIn}
                onPress={() => router.push("/auth/sign-in")}
                fullWidth
                size="lg"
              />

              <Pressable
                onPress={() => router.push("/auth/sign-up")}
                style={{ alignItems: "center" }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.primary,
                    fontWeight: "600",
                  }}
                >
                  {t.auth.noAccount} {t.auth.signUp}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── 3. Theme ── */}
        <SectionLabel title={t.settings.theme} />
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginBottom: 8 }}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              testID={`theme-${opt.key}`}
              onPress={() => { Haptics.selectionAsync(); setThemeMode(opt.key); }}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", gap: 5,
                backgroundColor: themeMode === opt.key ? theme.primary : theme.card,
                borderWidth: 2,
                borderColor: themeMode === opt.key ? theme.primary : theme.border,
              }}
            >
              <Feather name={opt.icon as any} size={22} color={themeMode === opt.key ? "#fff" : theme.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: themeMode === opt.key ? "#fff" : theme.text }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── 4. Notifications ── */}
        <SectionLabel title={t.settings.notifications} />
        <View style={{
          borderRadius: 16,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 8,
          overflow: "hidden",
        }}>
          <View style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
          }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, flex: 1 }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
                <Feather name="bell" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                  {t.settings.notifications}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                  {t.settings.notificationsDesc}
                </Text>
              </View>
            </View>
            <Switch
              testID="notifications-toggle"
              value={settings.notification_enabled}
              onValueChange={(v) => {
                Haptics.selectionAsync();
                updateSettings({ notification_enabled: v });
                if (Platform.OS !== "web") {
                  if (v) {
                    import("@/utils/notifications").then(({ requestPermission, getNotificationPermissionStatus }) => {
                      requestPermission().then(() =>
                        getNotificationPermissionStatus().then(setNotifPermission).catch(() => {})
                      ).catch(() => {});
                    });
                  } else {
                    import("@/utils/notifications").then(({ cancelAllCommitmentReminders }) => {
                      cancelAllCommitmentReminders().catch(() => {});
                    });
                  }
                }
              }}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>

          {/* Permission status row (native only) */}
          {Platform.OS !== "web" && notifPermission !== null && (
            <View style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 14,
              paddingBottom: 12,
              paddingTop: 0,
              gap: 10,
            }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather
                  name={notifPermission === "granted" ? "check-circle" : notifPermission === "denied" ? "x-circle" : "info"}
                  size={13}
                  color={notifPermission === "granted" ? "#22C55E" : notifPermission === "denied" ? "#EF4444" : "#F59E0B"}
                />
                <Text style={{ fontSize: 12, color: notifPermission === "granted" ? "#22C55E" : notifPermission === "denied" ? "#EF4444" : "#F59E0B" }}>
                  {notifPermission === "granted"
                    ? t.settings.notifPermGranted
                    : notifPermission === "denied"
                    ? t.settings.notifPermDenied
                    : t.settings.notifPermUndetermined}
                </Text>
              </View>
              {notifPermission === "denied" && (
                <Pressable
                  onPress={() => Linking.openSettings()}
                  style={{ backgroundColor: "#EF444415", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#EF444430" }}
                >
                  <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>{t.settings.notifOpenSettings}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* ── 5. Default Currency ── */}
        <SectionLabel title={t.settings.currencies} />
        <Pressable
          testID="settings-currency-toggle"
          onPress={() => { Haptics.selectionAsync(); setShowCurrencies((v) => !v); }}
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: 16,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: showCurrencies ? theme.primary : theme.border,
            marginBottom: showCurrencies ? 0 : 8,
          }}
        >
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20 }}>{selectedCurrencyObj.flag}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
              {t.settings.defaultCurrency}
            </Text>
            <Text style={{ fontSize: 12, color: theme.primary, fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
              {selectedCurrencyObj.code} — {currencyName}
            </Text>
          </View>
          <Feather name={showCurrencies ? "chevron-up" : "chevron-down"} size={18} color={theme.border} />
        </Pressable>

        {showCurrencies && (
          <View style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.primary,
            borderTopWidth: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingHorizontal: 10,
            paddingBottom: 10,
            marginBottom: 8,
            gap: 2,
          }}>
            {CURRENCIES.map((curr) => {
              const isSelected = defaultCurr === curr.code;
              const name = (t.currencies as any)[curr.code] || curr.code;
              return (
                <Pressable
                  key={curr.code}
                  testID={`currency-${curr.code}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateSettings({ default_currency: curr.code });
                    setShowCurrencies(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    backgroundColor: isSelected ? theme.primary + "18" : pressed ? theme.cardSecondary : "transparent",
                  })}
                >
                  <Text style={{ fontSize: 22, width: 32, textAlign: "center" }}>{curr.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: isSelected ? "700" : "500", color: isSelected ? theme.primary : theme.text, textAlign: isRTL ? "right" : "left" }}>
                      {name}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>{curr.code}</Text>
                  </View>
                  {isSelected && <Feather name="check" size={16} color={theme.primary} />}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── 6. Data Export ── */}
        <SectionLabel title={t.settings.data} />
        <Pressable
          testID="settings-export-btn"
          onPress={handleExport}
          disabled={exporting}
          style={({ pressed }) => ({
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: 16,
            backgroundColor: exportDone ? theme.incomeBackground : pressed ? theme.cardSecondary : theme.card,
            borderWidth: 1,
            borderColor: exportDone ? theme.income : theme.border,
            marginBottom: 8,
          })}
        >
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: exportDone ? theme.incomeBackground : "#3B82F618", alignItems: "center", justifyContent: "center" }}>
            <Feather
              name={exportDone ? "check-circle" : exporting ? "loader" : "download"}
              size={18}
              color={exportDone ? theme.income : "#3B82F6"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: exportDone ? theme.income : theme.text, textAlign: isRTL ? "right" : "left" }}>
              {exportDone ? t.settings.exportSuccess : t.settings.export}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
              {t.settings.exportDesc}
            </Text>
          </View>
          {!exportDone && <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={theme.border} />}
        </Pressable>
        <Pressable
          testID="settings-export-csv-btn"
          onPress={handleExportCSV}
          disabled={exportingCSV}
          style={({ pressed }) => ({
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: 16,
            backgroundColor: exportCSVDone ? theme.incomeBackground : pressed ? theme.cardSecondary : theme.card,
            borderWidth: 1,
            borderColor: exportCSVDone ? theme.income : theme.border,
            marginBottom: 8,
          })}
        >
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: exportCSVDone ? theme.incomeBackground : "#10B98118", alignItems: "center", justifyContent: "center" }}>
            <Feather
              name={exportCSVDone ? "check-circle" : exportingCSV ? "loader" : "grid"}
              size={18}
              color={exportCSVDone ? theme.income : "#10B981"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: exportCSVDone ? theme.income : theme.text, textAlign: isRTL ? "right" : "left" }}>
              {exportCSVDone ? t.settings.exportCSVSuccess : t.settings.exportCSV}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
              {t.settings.exportCSVDesc}
            </Text>
          </View>
          {!exportCSVDone && <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={theme.border} />}
        </Pressable>

        {/* ── 7. Danger Zone ── */}
        <SectionLabel title={t.settings.danger} />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setShowResetConfirm(true);
          }}
          disabled={resetting}
          style={({ pressed }) => ({
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: 16,
            backgroundColor: resetDone ? "#EF444415" : pressed ? "#EF444410" : theme.card,
            borderWidth: 1.5,
            borderColor: resetDone ? "#EF4444" : "#EF444440",
            marginBottom: 8,
          })}
        >
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#EF444420", alignItems: "center", justifyContent: "center" }}>
            <Feather
              name={resetDone ? "check-circle" : "trash-2"}
              size={18}
              color="#EF4444"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>
              {resetDone ? t.settings.resetSuccess : t.settings.reset}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
              {t.settings.resetDesc}
            </Text>
          </View>
          {!resetDone && <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color="#EF444460" />}
        </Pressable>

        {/* ── 8. Support ── */}
        <SectionLabel title={t.settings.support} />
        <View style={{ gap: 8, marginBottom: 8 }}>
          <NavRow
            icon="mail"
            iconColor="#6366F1"
            label={t.settings.contactSupport}
            subtitle={t.settings.contactSupportSubtitle}
            onPress={() => { Haptics.selectionAsync(); router.push("/contact-support"); }}
          />
        </View>

        {/* ── App Info ── */}
        <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.border, marginTop: 8 }}>
          <Image
            source={require("@/assets/images/icon.png")}
            resizeMode="contain"
            style={{ width: 72, height: 72, borderRadius: 16 }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.income }} />
            <Text style={{ fontSize: 11, color: theme.textMuted }}>{t.settings.version} 1.1.0</Text>
          </View>
          <Text style={{ fontSize: 10, color: theme.textMuted }}>
            {accounts.filter((a) => a.is_active).length} {t.settings.accountsCount} · {transactions.length} {t.settings.transactionsCount}
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>

      {/* ── Reset Confirmation Modal ── */}
      <Modal visible={showResetConfirm} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 24 }}
          onPress={() => !resetting && setShowResetConfirm(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.card,
              borderRadius: 22,
              padding: 24,
              gap: 16,
              borderWidth: 1.5,
              borderColor: "#EF444440",
            }}
            onPress={() => {}}
          >
            <View style={{ alignItems: "center", gap: 8 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#EF444420", alignItems: "center", justifyContent: "center" }}>
                <Feather name="alert-triangle" size={30} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#EF4444", textAlign: "center" }}>
                {t.settings.resetConfirmTitle}
              </Text>
            </View>

            <View style={{ backgroundColor: "#EF444410", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#EF444425" }}>
              <Text style={{ fontSize: 14, color: theme.text, textAlign: isRTL ? "right" : "left", lineHeight: 22 }}>
                {t.settings.resetConfirmMessage}
              </Text>
            </View>

            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              <Pressable
                onPress={() => setShowResetConfirm(false)}
                disabled={resetting}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: pressed ? theme.cardSecondary : theme.cardSecondary,
                  borderWidth: 1,
                  borderColor: theme.border,
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
                  {t.common.cancel}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleReset}
                disabled={resetting}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: resetting ? "#EF444460" : pressed ? "#DC2626" : "#EF4444",
                })}
              >
                {resetting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                    {t.settings.resetConfirm}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}
