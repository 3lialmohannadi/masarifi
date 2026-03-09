import React, { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useSavings } from "@/store/SavingsContext";
import { TransactionItem } from "@/components/TransactionItem";
import { SavingsWalletCard } from "@/components/SavingsWalletCard";
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

  const openQuickAdd = (type: TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuickAdd({ visible: true, type });
  };

  const activeAccounts = accounts.filter((a) => a.is_active);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId && a.is_active) ||
    activeAccounts[0] ||
    null;

  const currency = selectedAccount?.currency || "QAR";

  const totalBalance = selectedAccount?.balance ?? 0;

  const allocatedMoney = selectedAccount
    ? allocatedMoneyForAccount(selectedAccount.id)
    : 0;

  const realAvailable = totalBalance - allocatedMoney;

  const remainingDays = getRemainingDaysInMonth();
  const dailyLimit =
    settings.daily_limit_mode === "manual"
      ? settings.manual_daily_limit
      : remainingDays > 0
      ? realAvailable / remainingDays
      : 0;

  const recentTransactions = useMemo(() => {
    const filtered = selectedAccount
      ? transactions.filter((tx) => tx.account_id === selectedAccount.id)
      : transactions;
    return [...filtered]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [transactions, selectedAccount]);

  const shownCommitments = upcomingCommitments.slice(0, 3);
  const shownWallets = wallets.slice(0, 3);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 20;
  const heroText = (opacity: number) => `rgba(255,255,255,${opacity})`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 50 : 110),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ─── */}
        <View
          style={{
            backgroundColor: isDark ? "#0D1B35" : "#0A1628",
            paddingTop: topPadding,
            paddingHorizontal: 20,
            paddingBottom: 30,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            gap: 20,
          }}
        >
          {/* App name row */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: heroText(0.45), fontSize: 11, fontWeight: "600", letterSpacing: 1 }}>
                {language === "ar" ? "مصاريفي" : "MASARIFI"}
              </Text>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                {t.tabs.dashboard}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/settings/index")}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="settings" size={18} color={heroText(0.8)} />
            </Pressable>
          </View>

          {/* Account Pills */}
          {activeAccounts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
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
                      gap: 7,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isSelected ? "#fff" : "rgba(255,255,255,0.1)",
                      borderWidth: 1,
                      borderColor: isSelected ? "#fff" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: acc.color }} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: isSelected ? "#0A1628" : heroText(0.85) }}>
                      {getDisplayName(acc, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* ── الرصيد الكلي ── */}
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 12, color: heroText(0.5), fontWeight: "500" }}>
              {t.dashboard.totalBalance}
            </Text>
            <Text style={{ fontSize: 40, fontWeight: "800", color: "#fff", letterSpacing: -1 }}>
              {formatCurrency(totalBalance, currency, language)}
            </Text>
          </View>

          {/* ── الأموال المخصصة | المبلغ المتاح ── */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
            {/* الأموال المخصصة — commitments only */}
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(239,68,68,0.12)",
                borderRadius: 14,
                padding: 14,
                gap: 6,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.2)",
              }}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather name="lock" size={12} color="#EF4444" />
                <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>
                  {t.dashboard.allocatedMoney}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#EF4444" }} numberOfLines={1}>
                {formatCurrency(allocatedMoney, currency, language)}
              </Text>
            </View>

            {/* المبلغ المتاح الحقيقي = رصيد - مخصص */}
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(16,185,129,0.12)",
                borderRadius: 14,
                padding: 14,
                gap: 6,
                borderWidth: 1,
                borderColor: "rgba(16,185,129,0.2)",
              }}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather name="check-circle" size={12} color="#10B981" />
                <Text style={{ fontSize: 11, color: "#10B981", fontWeight: "600" }}>
                  {t.dashboard.realAvailable}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#10B981" }} numberOfLines={1}>
                {formatCurrency(Math.max(0, realAvailable), currency, language)}
              </Text>
            </View>
          </View>

          {/* ── الحد اليومي ── */}
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(255,255,255,0.07)",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <Feather name="sun" size={14} color={heroText(0.5)} />
              <View>
                <Text style={{ fontSize: 12, color: heroText(0.5) }}>{t.dashboard.dailyLimit}</Text>
                <Text style={{ fontSize: 10, color: heroText(0.3) }}>
                  {remainingDays} {t.dashboard.remainingDays}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#10B981" }}>
                {formatCurrency(Math.max(0, dailyLimit), currency, language)}
              </Text>
              <Text style={{ fontSize: 10, color: heroText(0.4) }}>/ {t.dashboard.day}</Text>
            </View>
          </View>
        </View>

        {/* ── أزرار الإضافة السريعة ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
            <Pressable
              testID="quick-add-expense"
              accessibilityLabel={t.transactions.expense}
              onPress={() => openQuickAdd("expense")}
              style={{ flex: 1, backgroundColor: theme.expense, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 5 }}
            >
              <Feather name="arrow-up" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{t.transactions.expense}</Text>
            </Pressable>
            <Pressable
              testID="quick-add-income"
              accessibilityLabel={t.transactions.income}
              onPress={() => openQuickAdd("income")}
              style={{ flex: 1, backgroundColor: theme.income, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 5 }}
            >
              <Feather name="arrow-down" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{t.transactions.income}</Text>
            </Pressable>
            <Pressable
              testID="quick-transfer"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/(modals)/transfer-form");
              }}
              style={{ flex: 1, backgroundColor: theme.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 5, borderWidth: 1, borderColor: theme.border }}
            >
              <Feather name="shuffle" size={18} color={theme.transfer} />
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700" }}>{t.transactions.transfer}</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 28, paddingTop: 24 }}>

          {/* ── آخر 3 عمليات ── */}
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
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 28, alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.border }}>
                <Feather name="inbox" size={26} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t.dashboard.noTransactions}</Text>
              </View>
            ) : (
              <View style={{ gap: 0 }}>
                {recentTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onPress={() => router.push(`/(modals)/add-transaction?id=${tx.id}`)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ── الالتزامات القادمة ── */}
          {shownCommitments.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                  {t.dashboard.upcomingCommitments}
                </Text>
                <Pressable
                  onPress={() => router.push("/commitments/index")}
                  style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showMore}</Text>
                  <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={14} color={theme.primary} />
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                {shownCommitments.map((c) => {
                  const isOverdue = c.status === "overdue";
                  const isDueToday = c.status === "due_today";
                  const accentColor = isOverdue ? "#EF4444" : isDueToday ? "#F59E0B" : theme.primary;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPayingCommitment(c.id);
                      }}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? theme.cardSecondary : theme.card,
                        borderRadius: 16,
                        padding: 14,
                        flexDirection: isRTL ? "row-reverse" : "row",
                        alignItems: "center",
                        gap: 12,
                        borderWidth: 1,
                        borderColor: isOverdue || isDueToday ? accentColor + "40" : theme.border,
                      })}
                    >
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: accentColor + "18", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="calendar" size={18} color={accentColor} />
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
                          {formatCurrency(c.amount, c.currency, language)}
                        </Text>
                        <View style={{ backgroundColor: accentColor + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: accentColor }}>
                            {t.commitments.status[c.status]}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── المحافظ الادخارية ── */}
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
              <View style={{ gap: 10 }}>
                {shownWallets.map((w) => (
                  <SavingsWalletCard
                    key={w.id}
                    wallet={w}
                    onPress={() => router.push(`/savings/${w.id}`)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB — زر الإضافة السريعة الثابت */}
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
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
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
