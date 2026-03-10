import React, { useState, useCallback } from "react";
import { View, Text, Pressable, Switch, Share, Platform, Image } from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useSavings } from "@/store/SavingsContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { usePlans } from "@/store/PlansContext";
import { useBudgets } from "@/store/BudgetsContext";
import { AppInput } from "@/components/ui/AppInput";

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
    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.8, textAlign: isRTL ? "right" : "left", paddingHorizontal: 4, marginBottom: 4, marginTop: 8 }}>
      {title}
    </Text>
  );
}

function NavRow({ icon, iconColor, label, subtitle, onPress, testID }: {
  icon: string; iconColor: string; label: string; subtitle?: string; onPress: () => void; testID?: string;
}) {
  const { theme, isRTL } = useApp();
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
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
      })}
    >
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: iconColor + "18", alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as any} size={18} color={iconColor} />
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
  const { theme, t, language, setLanguage, colorScheme, setColorScheme, settings, updateSettings, isRTL } = useApp();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { savingsWallets, savingsTransactions } = useSavings();
  const { commitments } = useCommitments();
  const { plans } = usePlans();
  const { budgets } = useBudgets();

  const [manualDailyLimit, setManualDailyLimit] = useState(String(settings.manual_daily_limit || ""));
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);

  const LANG_OPTIONS = [
    { code: "ar" as const, label: "العربية", flag: "🇶🇦" },
    { code: "en" as const, label: "English", flag: "🇬🇧" },
  ];

  const THEME_OPTIONS = [
    { key: "light" as const, label: t.settings.light, icon: "sun" },
    { key: "dark" as const, label: t.settings.dark, icon: "moon" },
    { key: "auto" as const, label: t.settings.auto, icon: "smartphone" },
  ];

  const LIMIT_MODES = [
    { key: "smart" as const, label: t.settings.smartLimit, desc: t.settings.smartLimitDesc, icon: "zap" },
    { key: "manual" as const, label: t.settings.manualLimit, desc: t.settings.manualLimitDesc, icon: "sliders" },
  ];

  const saveManualLimit = useCallback(() => {
    const val = parseFloat(manualDailyLimit);
    if (!isNaN(val) && val >= 0) updateSettings({ manual_daily_limit: val });
  }, [manualDailyLimit]);

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
        plans,
        budgets,
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
    } catch (_e) {
    } finally {
      setExporting(false);
    }
  }, [accounts, transactions, savingsWallets, savingsTransactions, commitments, plans, budgets, settings]);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const defaultCurr = settings.default_currency || "QAR";
  const selectedCurrencyObj = CURRENCIES.find((c) => c.code === defaultCurr) || CURRENCIES[0];
  const currencyName = (t.currencies as any)[defaultCurr] || defaultCurr;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 12,
        paddingTop: topPadding,
        paddingBottom: 14,
        paddingHorizontal: 16,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {t.settings.title}
        </Text>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 6 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* ── Language ── */}
        <SectionLabel title={t.settings.language} />
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10, marginBottom: 8 }}>
          {LANG_OPTIONS.map((opt) => (
            <Pressable
              key={opt.code}
              testID={`lang-${opt.code}`}
              onPress={() => { Haptics.selectionAsync(); setLanguage(opt.code); }}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: "center", gap: 6,
                backgroundColor: language === opt.code ? theme.primary : theme.card,
                borderWidth: 2,
                borderColor: language === opt.code ? theme.primary : theme.border,
              }}
            >
              <Text style={{ fontSize: 26 }}>{opt.flag}</Text>
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

        {/* ── Theme ── */}
        <SectionLabel title={t.settings.theme} />
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginBottom: 8 }}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              testID={`theme-${opt.key}`}
              onPress={() => { Haptics.selectionAsync(); setColorScheme(opt.key); }}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: "center", gap: 5,
                backgroundColor: colorScheme === opt.key ? theme.primary : theme.card,
                borderWidth: 2,
                borderColor: colorScheme === opt.key ? theme.primary : theme.border,
              }}
            >
              <Feather name={opt.icon as any} size={22} color={colorScheme === opt.key ? "#fff" : theme.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colorScheme === opt.key ? "#fff" : theme.text }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Daily Limit Mode ── */}
        <SectionLabel title={t.settings.dailyLimitMode} />
        <View style={{ gap: 8, marginBottom: 8 }}>
          {LIMIT_MODES.map((opt) => {
            const active = settings.daily_limit_mode === opt.key;
            return (
              <Pressable
                key={opt.key}
                testID={`limit-${opt.key}`}
                onPress={() => { Haptics.selectionAsync(); updateSettings({ daily_limit_mode: opt.key }); }}
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: active ? theme.primaryLight : theme.card,
                  borderWidth: 2,
                  borderColor: active ? theme.primary : theme.border,
                }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: active ? theme.primary + "25" : theme.border + "50", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={opt.icon as any} size={18} color={active ? theme.primary : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>{opt.label}</Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{opt.desc}</Text>
                </View>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 2,
                  borderColor: active ? theme.primary : theme.border,
                  backgroundColor: active ? theme.primary : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" }} />}
                </View>
              </Pressable>
            );
          })}

          {settings.daily_limit_mode === "manual" && (
            <View style={{ paddingTop: 4 }}>
              <AppInput
                testID="manual-limit-input"
                label={t.settings.manualLimitAmount}
                value={manualDailyLimit}
                onChangeText={(v) => {
                  setManualDailyLimit(v);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                onEndEditing={saveManualLimit}
                onBlur={saveManualLimit}
              />
              {manualDailyLimit !== "" && !isNaN(parseFloat(manualDailyLimit)) && (
                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? "right" : "left", paddingHorizontal: 4, marginTop: 4 }}>
                  {language === "ar" ? "يتم الحفظ تلقائياً عند الانتهاء" : "Saved automatically on exit"}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Manage ── */}
        <SectionLabel title={t.settings.manage} />
        <View style={{ gap: 8, marginBottom: 8 }}>
          <NavRow
            testID="settings-manage-accounts"
            icon="credit-card"
            iconColor={theme.primary}
            label={t.settings.accounts}
            subtitle={t.settings.accountsDesc}
            onPress={() => router.push("/accounts/list")}
          />
          <NavRow
            testID="settings-manage-categories"
            icon="tag"
            iconColor="#EC4899"
            label={t.settings.categories}
            subtitle={t.settings.categoriesDesc}
            onPress={() => router.push("/categories")}
          />
        </View>

        {/* ── Default Currency ── */}
        <SectionLabel title={t.settings.currencies} />
        <Pressable
          testID="settings-currency-toggle"
          onPress={() => { Haptics.selectionAsync(); setShowCurrencies((v) => !v); }}
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: 14,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: showCurrencies ? theme.primary : theme.border,
            marginBottom: showCurrencies ? 0 : 8,
          }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
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
            borderRadius: 14,
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

        {/* ── Data Export ── */}
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
            borderRadius: 14,
            backgroundColor: exportDone ? theme.incomeBackground : pressed ? theme.cardSecondary : theme.card,
            borderWidth: 1,
            borderColor: exportDone ? theme.income : theme.border,
            marginBottom: 8,
          })}
        >
          <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: exportDone ? theme.incomeBackground : "#3B82F618", alignItems: "center", justifyContent: "center" }}>
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

        {/* ── Notifications ── */}
        <SectionLabel title={t.settings.notifications} />
        <View style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 14,
          borderRadius: 14,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 8,
        }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
              <Feather name="bell" size={18} color="#F59E0B" />
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
            onValueChange={(v) => { Haptics.selectionAsync(); updateSettings({ notification_enabled: v }); }}
            trackColor={{ true: theme.primary, false: theme.border }}
          />
        </View>

        {/* ── App Info ── */}
        <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.border, marginTop: 8 }}>
          <Image
            source={require("@/assets/logo_transparent.png")}
            resizeMode="contain"
            style={{ width: 160, height: 56 }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.income }} />
            <Text style={{ fontSize: 11, color: theme.textMuted }}>{t.settings.version} 1.0.0</Text>
          </View>
          <Text style={{ fontSize: 10, color: theme.textMuted }}>
            {accounts.filter((a) => a.is_active).length} {language === "ar" ? "حسابات" : "accounts"} · {transactions.length} {language === "ar" ? "عمليات" : "transactions"}
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
