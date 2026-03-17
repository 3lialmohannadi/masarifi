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
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useSavings } from "@/store/SavingsContext";
import { useDebts } from "@/store/DebtsContext";
import { TransactionItem } from "@/components/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
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
  const { accounts, isLoaded: accountsLoaded } = useAccounts();
  const { transactions, isLoaded: txLoaded } = useTransactions();
  const { allocatedMoneyForAccount, upcomingCommitments } = useCommitments();
  const { wallets } = useSavings();
  const { debts, totalRemaining: debtsTotalRemaining, activeDebts } = useDebts();
  const { displayName: firstName } = useAuth();
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

  if (!accountsLoaded || !txLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ width: 160, height: 48, borderRadius: 8, backgroundColor: theme.card }} />
        </View>
        <DashboardSkeleton />
      </View>
    );
  }

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
          <View style={{ gap: 5 }}>
            <Image
              source={isDark ? (language === "ar" ? require("@/assets/logo_ar_dark.png") : require("@/assets/logo_en_dark.png")) : language === "ar" ? require("@/assets/logo_ar_light.png") : require("@/assets/logo_en_light.png")}
              resizeMode="contain"
              style={{ width: language === "ar" ? 220 : 160, height: language === "ar" ? 76 : 56 }}
            />
            {firstName ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.primary }} />
                <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                  {t.auth.greeting}{isRTL ? "،" : ","} {firstName}
                </Text>
              </View>
            ) : null}
          </View>
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
          <Animated.View entering={FadeInDown.delay(0).springify()}>
          <LinearGradient
            colors={isDark
              ? ["#1A3630", "#0F2820", "#0A1C16"] as const
              : ["#2D8F83", "#1E6B63", "#165550"] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 22,
              overflow: "hidden",
              ...(Platform.OS === "web"
                ? { boxShadow: `0 8px 32px rgba(47,143,131,${isDark ? 0.25 : 0.40})` }
                : {
                    shadowColor: "#2F8F83",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.25 : 0.40,
                    shadowRadius: 20,
                    elevation: 14,
                  }),
            }}
          >
            {/* Decorative circles */}
            <View style={{ position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.07)" }} />
            <View style={{ position: "absolute", bottom: -40, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)" }} />
            <View style={{ position: "absolute", top: 30, right: 80, width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.04)" }} />

            {/* Account name + icon row */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                {selectedAccount && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color || "rgba(255,255,255,0.6)" }} />
                )}
                <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)" }}>
                  {selectedAccount
                    ? getDisplayName(selectedAccount, language)
                    : t.common.noAccount}
                </Text>
              </View>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="credit-card" size={17} color="rgba(255,255,255,0.8)" />
              </View>
            </View>

            {/* Balance */}
            <View style={{ gap: 3, marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: "500", textAlign: isRTL ? "right" : "left" }}>
                {t.dashboard.totalBalance}
              </Text>
              <Text style={{ fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -1, textAlign: isRTL ? "right" : "left" }}>
                {formatCurrency(totalBalance, currency, language)}
              </Text>
            </View>

            {/* Monthly Income / Expense */}
            {(() => {
              const today = new Date();
              const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
              const monthTxs = transactions.filter((tx) =>
                tx.date.startsWith(monthKey) && (!selectedAccount || tx.account_id === selectedAccount.id)
              );
              const monthIncome = monthTxs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
              const monthExpense = monthTxs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
              return (
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: "rgba(34,197,94,0.15)", borderRadius: 12, padding: 10, gap: 2, borderWidth: 1, borderColor: "rgba(34,197,94,0.2)" }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                      <Feather name="arrow-down-left" size={11} color="rgba(34,197,94,0.9)" />
                      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "500" }}>{t.transactions.income}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#4ADE80", textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
                      {formatCurrency(monthIncome, currency, language)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 12, padding: 10, gap: 2, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                      <Feather name="arrow-up-right" size={11} color="rgba(239,68,68,0.9)" />
                      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "500" }}>{t.transactions.expense}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#F87171", textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
                      {formatCurrency(monthExpense, currency, language)}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </LinearGradient>
          </Animated.View>

          {/* ─── Financial Metrics Card ─── */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
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
                  {t.common.balance}
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

            {/* Daily Limit Row + Spending Progress */}
            {(() => {
              const today2 = new Date();
              const mk = `${today2.getFullYear()}-${String(today2.getMonth() + 1).padStart(2, "0")}`;
              const monthTxs2 = transactions.filter((tx) =>
                tx.date.startsWith(mk) && (!selectedAccount || tx.account_id === selectedAccount?.id)
              );
              const mExpense = monthTxs2.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
              const showBar = realAvailable > 0 || mExpense > 0;
              const spendRatio = (realAvailable + mExpense) > 0 ? Math.min(mExpense / (realAvailable + mExpense), 1) : 0;
              const spendColor = spendRatio >= 0.9 ? "#EF4444" : spendRatio >= 0.7 ? "#F59E0B" : theme.income;
              return (
                <View>
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTopWidth: 1,
                      borderTopColor: theme.border,
                      paddingHorizontal: 16,
                      paddingTop: 11,
                      paddingBottom: showBar ? 8 : 11,
                    }}
                  >
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 7 }}>
                      <Feather name="activity" size={13} color={theme.textMuted} />
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>
                        {t.dashboard.dailyLimit}
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}> · {remainingDays} {t.dashboard.remainingDays}</Text>
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: theme.income }}>
                      {formatCurrency(Math.max(0, dailyLimit), currency, language)}
                    </Text>
                  </View>
                  {showBar && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 4 }}>
                      <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" }}>
                        <View style={{ width: `${Math.round(spendRatio * 100)}%` as any, height: "100%", backgroundColor: spendColor, borderRadius: 2 }} />
                      </View>
                      <Text style={{ fontSize: 10, color: spendColor, textAlign: isRTL ? "right" : "left" }}>
                        {Math.round(spendRatio * 100)}% {language === "ar" ? "من الرصيد المتاح" : "of available balance"}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
          </Animated.View>

          {/* ─── Quick Add ─── */}
          <Animated.View entering={FadeInDown.delay(160).springify()}>
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: theme.border,
              gap: 10,
              ...cardShadow,
            }}
          >
            {/* Primary actions - Income + Expense */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              <Pressable
                testID="quick-add-income"
                accessibilityLabel={t.transactions.income}
                onPress={() => openQuickAdd("income")}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: pressed ? theme.income + "25" : theme.income + "18",
                  borderWidth: 1,
                  borderColor: theme.income + "30",
                })}
              >
                <Feather name="arrow-down-left" size={18} color={theme.income} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.income }}>
                  {t.transactions.income}
                </Text>
              </Pressable>

              <Pressable
                testID="quick-add-expense"
                accessibilityLabel={t.transactions.expense}
                onPress={() => openQuickAdd("expense")}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: pressed ? theme.expense + "25" : theme.expense + "18",
                  borderWidth: 1,
                  borderColor: theme.expense + "30",
                })}
              >
                <Feather name="arrow-up-right" size={18} color={theme.expense} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.expense }}>
                  {t.transactions.expense}
                </Text>
              </Pressable>
            </View>

            {/* Secondary actions - Commitment + Savings */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(modals)/commitment-form");
                }}
                style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: 10 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="repeat" size={18} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#F59E0B", textAlign: "center" }}>
                  {t.commitments.title}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(modals)/savings-movement");
                }}
                style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: 10 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#3B82F618", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="pocket" size={18} color="#3B82F6" />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#3B82F6", textAlign: "center" }}>
                  {t.tabs.savings}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(modals)/transfer-form");
                }}
                style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: 10 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${theme.transfer}18`, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="shuffle" size={18} color={theme.transfer} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: theme.transfer, textAlign: "center" }}>
                  {t.transfer.title}
                </Text>
              </Pressable>
            </View>
          </View>
          </Animated.View>

          {/* ─── Recent Transactions ─── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
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
          </Animated.View>

          {/* ─── Upcoming Commitments ─── */}
          <Animated.View entering={FadeInDown.delay(320).springify()}>
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
                  subtitle={t.commitments.addFirstCommitment}
                />
              </View>
            ) : (
              <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: "hidden", ...cardShadow }}>
                {shownCommitments.map((c, index) => {
                  const isOverdue = c.status === "overdue";
                  const isDueToday = c.status === "due_today";
                  const accentColor = isOverdue ? "#EF4444" : isDueToday ? "#F59E0B" : theme.primary;
                  const commitmentAccount = accounts.find((a) => a.id === c.account_id);
                  const commitmentCurrency = commitmentAccount?.currency || settings.default_currency || "QAR";
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
          </Animated.View>

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

          {/* ─── Debts Summary ─── */}
          {debts.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                  {t.debts.debtSummary}
                </Text>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.push("/debts" as any); }}
                  style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={{ fontSize: 13, color: "#EF4444", fontWeight: "600" }}>{t.dashboard.showAll}</Text>
                  <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={14} color="#EF4444" />
                </Pressable>
              </View>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.push("/debts" as any); }}
                style={({ pressed }) => ({
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 14,
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 12,
                  ...cardShadow,
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#EF444418", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="credit-card" size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                    {activeDebts.length} {t.debts.filterActive.toLowerCase()}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                    {t.debts.remaining}: {formatCurrency(debtsTotalRemaining, currency, language)}
                  </Text>
                </View>
                <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={theme.textMuted} />
              </Pressable>
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

      {quickAdd.visible && (
        <QuickAddSheet
          visible={quickAdd.visible}
          initialType={quickAdd.type}
          onClose={() => setQuickAdd((s) => ({ ...s, visible: false }))}
        />
      )}
    </View>
  );
}
