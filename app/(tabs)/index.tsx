import React, { useMemo, useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useSavings } from "@/store/SavingsContext";
import { TransactionItem } from "@/components/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { formatCurrency } from "@/utils/currency";
import { getRemainingDaysInMonth, formatDateShort } from "@/utils/date";
import { getDisplayName } from "@/utils/display";
import PayNowModal from "@/components/PayNowModal";
import type { TransactionType } from "@/types";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    theme, language, t, settings,
    selectedAccountId, setSelectedAccountId,
    isRTL, isDark,
  } = useApp();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { allocatedMoneyForAccount, upcomingCommitments } = useCommitments();
  const { wallets } = useSavings();
  const [payingCommitment, setPayingCommitment] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<{ visible: boolean; type: TransactionType }>({ visible: false, type: "expense" });

  const openQuickAdd = useCallback((type: TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuickAdd({ visible: true, type });
  }, []);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts]
  );

  const selectedAccount = useMemo(
    () =>
      accounts.find((a) => a.id === selectedAccountId && a.is_active) ||
      activeAccounts[0] ||
      null,
    [accounts, selectedAccountId, activeAccounts]
  );

  const currency = selectedAccount?.currency || "QAR";
  const totalBalance = selectedAccount?.balance ?? 0;

  const allocatedMoney = useMemo(
    () => (selectedAccount ? allocatedMoneyForAccount(selectedAccount.id) : 0),
    [selectedAccount, allocatedMoneyForAccount]
  );

  const realAvailable = totalBalance - allocatedMoney;

  const remainingDays = useMemo(() => getRemainingDaysInMonth(), []);
  const dailyLimit = useMemo(
    () =>
      settings.daily_limit_mode === "manual"
        ? settings.manual_daily_limit
        : remainingDays > 0
        ? realAvailable / remainingDays
        : 0,
    [settings.daily_limit_mode, settings.manual_daily_limit, remainingDays, realAvailable]
  );

  const recentTransactions = useMemo(() => {
    const filtered = selectedAccount
      ? transactions.filter((tx) => tx.account_id === selectedAccount.id)
      : transactions;
    return [...filtered]
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.id > a.id ? 1 : -1;
      })
      .slice(0, 3);
  }, [transactions, selectedAccount]);

  const shownCommitments = useMemo(
    () => upcomingCommitments.slice(0, 3),
    [upcomingCommitments]
  );
  const shownWallets = useMemo(
    () => wallets.filter((w) => !w.is_archived).slice(0, 3),
    [wallets]
  );

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const cardShadow = useMemo(
    () =>
      Platform.OS === "web"
        ? { boxShadow: isDark ? "none" : "0 2px 12px rgba(47,143,131,0.08)" }
        : isDark
        ? {}
        : {
            shadowColor: "#2F8F83",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          },
    [isDark]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View
          style={{
            paddingTop: topPadding,
            paddingHorizontal: 20,
            paddingBottom: 16,
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Image
            source={require("@/assets/logo_transparent.png")}
            resizeMode="contain"
            style={{ width: 110, height: 38 }}
          />
          <Pressable
            onPress={() => router.push("/settings")}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: theme.card,
              borderWidth: 1, borderColor: theme.border,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Feather name="settings" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* ─── Account Selector Pills ─── */}
        {activeAccounts.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            style={{ marginBottom: 12 }}
          >
            {activeAccounts.map((acc) => {
              const isSelected = acc.id === (selectedAccount?.id ?? "");
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedAccountId(acc.id);
                  }}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderWidth: 1,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : acc.color }} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: isSelected ? "#fff" : theme.textSecondary }}>
                    {getDisplayName(acc, language)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={{ paddingHorizontal: 20, gap: 14 }}>

          {/* ─── Account Card (Bank Card Style) ─── */}
          <View
            style={{
              borderRadius: 24,
              backgroundColor: isDark ? "#1E3A37" : theme.primary,
              padding: 22,
              minHeight: 158,
              overflow: "hidden",
              ...(Platform.OS === "web"
                ? { boxShadow: `0 8px 24px rgba(47,143,131,${isDark ? 0.2 : 0.35})` }
                : {
                    shadowColor: "#2F8F83",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.2 : 0.35,
                    shadowRadius: 16,
                    elevation: 12,
                  }),
            }}
          >
            {/* Decorative circles */}
            <View style={{ position: "absolute", top: -50, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)" }} />
            <View style={{ position: "absolute", bottom: -30, left: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.04)" }} />

            {/* Account name + icon row */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                {selectedAccount && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color || "rgba(255,255,255,0.6)" }} />
                )}
                <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
                  {selectedAccount
                    ? getDisplayName(selectedAccount, language)
                    : language === "ar" ? "لا يوجد حساب" : "No Account"}
                </Text>
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="credit-card" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            </View>

            {/* Balance */}
            <View style={{ marginTop: 28, gap: 4 }}>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: "500", textAlign: isRTL ? "right" : "left" }}>
                {t.dashboard.totalBalance}
              </Text>
              <Text style={{ fontSize: 34, fontWeight: "800", color: "#fff", letterSpacing: -0.5, textAlign: isRTL ? "right" : "left" }}>
                {formatCurrency(totalBalance, currency, language)}
              </Text>
            </View>
          </View>

          {/* ─── Financial Metrics Card ─── */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.border,
              overflow: "hidden",
              ...cardShadow,
            }}
          >
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              {/* Total Balance */}
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 10, alignItems: "center", gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${theme.primary}18`, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="bar-chart-2" size={15} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 10, color: theme.textMuted, textAlign: "center", fontWeight: "500" }}>
                  {language === "ar" ? "الرصيد" : "Balance"}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, textAlign: "center" }} numberOfLines={1}>
                  {formatCurrency(totalBalance, currency, language)}
                </Text>
              </View>

              <View style={{ width: 1, backgroundColor: theme.border, marginVertical: 14 }} />

              {/* Allocated */}
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 10, alignItems: "center", gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#EF444418", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="lock" size={15} color="#EF4444" />
                </View>
                <Text style={{ fontSize: 10, color: theme.textMuted, textAlign: "center", fontWeight: "500" }}>
                  {t.dashboard.allocatedMoney}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#EF4444", textAlign: "center" }} numberOfLines={1}>
                  {formatCurrency(allocatedMoney, currency, language)}
                </Text>
              </View>

              <View style={{ width: 1, backgroundColor: theme.border, marginVertical: 14 }} />

              {/* Real Available */}
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 10, alignItems: "center", gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${realAvailable < 0 ? "#EF4444" : theme.income}18`, alignItems: "center", justifyContent: "center" }}>
                  <Feather name={realAvailable < 0 ? "alert-circle" : "check-circle"} size={15} color={realAvailable < 0 ? "#EF4444" : theme.income} />
                </View>
                <Text style={{ fontSize: 10, color: theme.textMuted, textAlign: "center", fontWeight: "500" }}>
                  {t.dashboard.realAvailable}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: realAvailable < 0 ? "#EF4444" : theme.income, textAlign: "center" }} numberOfLines={1}>
                  {formatCurrency(realAvailable, currency, language)}
                </Text>
              </View>
            </View>

            {/* Daily Limit Row */}
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: theme.border,
                paddingHorizontal: 16,
                paddingVertical: 11,
              }}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 7 }}>
                <Feather name="sun" size={13} color={theme.textMuted} />
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  {t.dashboard.dailyLimit}
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}> · {remainingDays} {t.dashboard.remainingDays}</Text>
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: theme.income }}>
                {formatCurrency(Math.max(0, dailyLimit), currency, language)}
              </Text>
            </View>
          </View>

          {/* ─── Quick Add ─── */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              paddingVertical: 18,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: theme.border,
              ...cardShadow,
            }}
          >
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 4 }}>
              {/* Income */}
              <Pressable
                testID="quick-add-income"
                accessibilityLabel={t.transactions.income}
                onPress={() => openQuickAdd("income")}
                style={{ flex: 1, alignItems: "center", gap: 8 }}
              >
                <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: `${theme.income}18`, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="arrow-down-circle" size={22} color={theme.income} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: theme.income, textAlign: "center" }}>
                  {t.transactions.income}
                </Text>
              </Pressable>

              {/* Expense */}
              <Pressable
                testID="quick-add-expense"
                accessibilityLabel={t.transactions.expense}
                onPress={() => openQuickAdd("expense")}
                style={{ flex: 1, alignItems: "center", gap: 8 }}
              >
                <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: "#EF444418", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="arrow-up-circle" size={22} color={theme.expense} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: theme.expense, textAlign: "center" }}>
                  {t.transactions.expense}
                </Text>
              </Pressable>

              {/* Commitment */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(modals)/commitment-form");
                }}
                style={{ flex: 1, alignItems: "center", gap: 8 }}
              >
                <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="repeat" size={22} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#F59E0B", textAlign: "center" }}>
                  {language === "ar" ? "التزام" : "Commitment"}
                </Text>
              </Pressable>

              {/* Savings */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(modals)/savings-movement");
                }}
                style={{ flex: 1, alignItems: "center", gap: 8 }}
              >
                <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: "#3B82F618", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="pocket" size={22} color="#3B82F6" />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#3B82F6", textAlign: "center" }}>
                  {language === "ar" ? "ادخار" : "Savings"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ─── Recent Transactions ─── */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                {t.dashboard.recentTransactions}
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/transactions")}
                style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}
              >
                <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showMore}</Text>
                <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={14} color={theme.primary} />
              </Pressable>
            </View>

            {recentTransactions.length === 0 ? (
              <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: "hidden", ...cardShadow }}>
                <EmptyState
                  icon="inbox"
                  title={t.transactions.noTransactions}
                  subtitle={t.transactions.addFirst}
                />
              </View>
            ) : (
              <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: "hidden", ...cardShadow }}>
                {recentTransactions.map((tx, index) => (
                  <View key={tx.id}>
                    {index > 0 && <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 16 }} />}
                    <TransactionItem
                      transaction={tx}
                      flat
                      onPress={() => router.push(`/(modals)/add-transaction?id=${tx.id}`)}
                    />
                  </View>
                ))}
                <Pressable
                  onPress={() => router.push("/(tabs)/transactions")}
                  style={({ pressed }) => ({
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: "center",
                    gap: 4,
                    backgroundColor: pressed ? theme.cardSecondary : "transparent",
                  })}
                >
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showMore}</Text>
                  <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={13} color={theme.primary} />
                </Pressable>
              </View>
            )}
          </View>

          {/* ─── Upcoming Commitments ─── */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                {t.dashboard.upcomingCommitments}
              </Text>
              <Pressable
                onPress={() => router.push("/commitments")}
                style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}
              >
                <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showAll}</Text>
                <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={14} color={theme.primary} />
              </Pressable>
            </View>

            {shownCommitments.length === 0 ? (
              <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: "hidden", ...cardShadow }}>
                <EmptyState
                  icon="calendar"
                  title={t.dashboard.noCommitments}
                  subtitle={language === "ar" ? "أضف التزاماتك لتتبع فواتيرك" : "Add commitments to track your bills"}
                />
              </View>
            ) : (
              <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: "hidden", ...cardShadow }}>
                {shownCommitments.map((c, index) => {
                  const isOverdue = c.status === "overdue";
                  const isDueToday = c.status === "due_today";
                  const accentColor = isOverdue ? "#EF4444" : isDueToday ? "#F59E0B" : theme.primary;
                  const commitmentAccount = accounts.find((a) => a.id === c.account_id);
                  const commitmentCurrency = commitmentAccount?.currency || "SAR";
                  return (
                    <View key={c.id}>
                      {index > 0 && <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 16 }} />}
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPayingCommitment(c.id);
                        }}
                        style={({ pressed }) => ({
                          padding: 14,
                          flexDirection: isRTL ? "row-reverse" : "row",
                          alignItems: "center",
                          gap: 12,
                          backgroundColor: pressed ? theme.cardSecondary : "transparent",
                        })}
                      >
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: accentColor + "18", alignItems: "center", justifyContent: "center" }}>
                          <Feather name="calendar" size={17} color={accentColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
                            {getDisplayName(c, language)}
                          </Text>
                          <Text style={{ fontSize: 12, color: isOverdue ? theme.expense : theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                            {formatDateShort(c.due_date, language)}
                          </Text>
                        </View>
                        <View style={{ alignItems: isRTL ? "flex-start" : "flex-end", gap: 4 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: accentColor }}>
                            {formatCurrency(c.amount, commitmentCurrency, language)}
                          </Text>
                          <View style={{ backgroundColor: accentColor + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: accentColor }}>
                              {t.commitments.status[c.status]}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
                <Pressable
                  onPress={() => router.push("/commitments")}
                  style={({ pressed }) => ({
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: "center",
                    gap: 4,
                    backgroundColor: pressed ? theme.cardSecondary : "transparent",
                  })}
                >
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showAll}</Text>
                  <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={13} color={theme.primary} />
                </Pressable>
              </View>
            )}
          </View>

          {/* ─── Savings Wallets ─── */}
          {shownWallets.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                  {t.dashboard.savingsWallets}
                </Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/savings")}
                  style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showMore}</Text>
                  <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={14} color={theme.primary} />
                </Pressable>
              </View>
              <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: "hidden", ...cardShadow }}>
                {shownWallets.map((w, index) => {
                  const hasGoal = !!(w.target_amount && w.target_amount > 0);
                  const progress = hasGoal ? Math.min(w.current_amount / w.target_amount!, 1) : 0;
                  const percentage = Math.round(progress * 100);
                  const walletColor = w.color || theme.primary;
                  return (
                    <View key={w.id}>
                      {index > 0 && <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 16 }} />}
                      <Pressable
                        onPress={() => router.push(`/savings/${w.id}`)}
                        style={({ pressed }) => ({
                          padding: 14,
                          backgroundColor: pressed ? theme.cardSecondary : "transparent",
                          gap: hasGoal ? 10 : 0,
                        })}
                      >
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: walletColor + "18", alignItems: "center", justifyContent: "center" }}>
                            <MaterialCommunityIcons name={(w.icon || "piggy-bank") as any} size={17} color={walletColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
                              {getDisplayName(w, language)}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                              {formatCurrency(w.current_amount, currency, language)}
                              {hasGoal ? ` / ${formatCurrency(w.target_amount!, currency, language)}` : ""}
                            </Text>
                          </View>
                          {hasGoal && (
                            <Text style={{ fontSize: 13, fontWeight: "700", color: walletColor }}>
                              {percentage}%
                            </Text>
                          )}
                        </View>
                        {/* Progress Bar — only for goal-based savings */}
                        {hasGoal && (
                          <View style={{ height: 5, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" }}>
                            <View
                              style={{
                                width: `${percentage}%` as any,
                                height: "100%",
                                backgroundColor: walletColor,
                                borderRadius: 3,
                              }}
                            />
                          </View>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        testID="fab-add"
        accessibilityLabel={t.transactions.add}
        onPress={() => openQuickAdd("expense")}
        style={{
          position: "absolute",
          bottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
          ...(Platform.OS === "web"
            ? { boxShadow: "0 4px 12px rgba(0,0,0,0.30)" }
            : { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }),
        }}
      >
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>

      {payingCommitment && (
        <PayNowModal commitmentId={payingCommitment} onClose={() => setPayingCommitment(null)} />
      )}

      <QuickAddSheet
        visible={quickAdd.visible}
        initialType={quickAdd.type}
        onClose={() => setQuickAdd((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}
