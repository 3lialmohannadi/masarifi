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
import { formatCurrency } from "@/utils/currency";
import { getRemainingDaysInMonth, formatDateShort } from "@/utils/date";
import { getDisplayName } from "@/utils/display";
import PayNowModal from "@/components/PayNowModal";
import { useCategories } from "@/store/CategoriesContext";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme, language, t, settings, selectedAccountId, setSelectedAccountId, isRTL, isDark } = useApp();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { allocatedMoneyForAccount, upcomingCommitments } = useCommitments();
  const { wallets } = useSavings();
  const { getCategory } = useCategories();
  const [payingCommitment, setPayingCommitment] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const totalBalance = selectedAccount?.balance ?? 0;
  const allocatedMoney = selectedAccount ? allocatedMoneyForAccount(selectedAccount.id) : 0;
  const realAvailable = totalBalance - allocatedMoney;
  const currency = selectedAccount?.currency || "QAR";

  const remainingDays = getRemainingDaysInMonth();
  const dailyLimit =
    settings.daily_limit_mode === "manual"
      ? settings.manual_daily_limit
      : remainingDays > 0
      ? realAvailable / remainingDays
      : 0;

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthTxs = useMemo(() => {
    const filtered = selectedAccount
      ? transactions.filter((tx) => tx.account_id === selectedAccount.id)
      : transactions;
    return filtered.filter((tx) => tx.date.startsWith(monthKey));
  }, [transactions, selectedAccount, monthKey]);

  const monthIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const recentTransactions = useMemo(() => {
    const filtered = selectedAccount
      ? transactions.filter((t) => t.account_id === selectedAccount.id)
      : transactions;
    return [...filtered]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions, selectedAccount]);

  const shownCommitments = upcomingCommitments.slice(0, 2);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 20;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 50 : 110),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <View
          style={{
            backgroundColor: isDark ? "#0D1B35" : "#0A1628",
            paddingTop: topPadding,
            paddingHorizontal: 20,
            paddingBottom: 28,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            gap: 22,
          }}
        >
          {/* Top row */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "500" }}>
                {language === "ar" ? "مصاريفي" : "Masarifi"}
              </Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {t.tabs.dashboard}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/settings/index")}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="settings" size={18} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>

          {/* Account Pills */}
          {accounts.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {accounts.filter((a) => a.is_active).map((acc) => {
                const isSelected = acc.id === (selectedAccount?.id || "");
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => { Haptics.selectionAsync(); setSelectedAccountId(acc.id); }}
                    style={{
                      flexDirection: "row",
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
                    <Text style={{ fontSize: 13, fontWeight: "600", color: isSelected ? "#0A1628" : "rgba(255,255,255,0.85)" }}>
                      {getDisplayName(acc, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Balance */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: "500" }}>
              {t.dashboard.totalBalance}
            </Text>
            <Text style={{ fontSize: 38, fontWeight: "800", color: "#fff", letterSpacing: -1 }}>
              {formatCurrency(totalBalance, currency, language)}
            </Text>
          </View>

          {/* Income / Expense this month */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(34,197,94,0.12)", borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: "rgba(34,197,94,0.2)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather name="arrow-down-left" size={14} color="#22C55E" />
                <Text style={{ fontSize: 11, color: "#22C55E", fontWeight: "600" }}>{t.transactions.income}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#22C55E" }}>
                {formatCurrency(monthIncome, currency, language)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather name="arrow-up-right" size={14} color="#EF4444" />
                <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>{t.transactions.expense}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#EF4444" }}>
                {formatCurrency(monthExpense, currency, language)}
              </Text>
            </View>
          </View>

          {/* Daily limit */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <Feather name="calendar" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.dashboard.dailyLimit}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#10B981" }}>
              {formatCurrency(Math.max(0, dailyLimit), currency, language)}
              <Text style={{ fontSize: 11, fontWeight: "400", color: "rgba(255,255,255,0.4)" }}> /{language === "ar" ? "يوم" : "day"}</Text>
            </Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 4 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(modals)/add-transaction?type=expense"); }}
              style={{ flex: 1, backgroundColor: theme.expense, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 6 }}
            >
              <Feather name="minus" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{t.transactions.expense}</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(modals)/add-transaction?type=income"); }}
              style={{ flex: 1, backgroundColor: theme.income, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 6 }}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{t.transactions.income}</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(modals)/transfer-form"); }}
              style={{ flex: 1, backgroundColor: theme.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: theme.border }}
            >
              <Feather name="shuffle" size={18} color={theme.transfer} />
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>{t.transfer.title}</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 24, paddingTop: 20 }}>
          {/* Recent Transactions */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>{t.dashboard.recentTransactions}</Text>
              <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showMore}</Text>
              </Pressable>
            </View>
            {recentTransactions.length === 0 ? (
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 24, alignItems: "center", gap: 8 }}>
                <Feather name="inbox" size={28} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t.dashboard.noTransactions}</Text>
              </View>
            ) : (
              <View>
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

          {/* Upcoming Commitments */}
          {shownCommitments.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>{t.dashboard.upcomingCommitments}</Text>
                <Pressable onPress={() => router.push("/commitments/index")}>
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showMore}</Text>
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
                      onPress={() => setPayingCommitment(c.id)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? theme.cardSecondary : theme.card,
                        borderRadius: 16,
                        padding: 14,
                        flexDirection: isRTL ? "row-reverse" : "row",
                        alignItems: "center",
                        gap: 12,
                      })}
                    >
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: accentColor + "18", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="calendar" size={18} color={accentColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
                          {getDisplayName(c, language)}
                        </Text>
                        <Text style={{ fontSize: 12, color: isOverdue ? "#EF4444" : theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                          {formatDateShort(c.due_date, language)}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
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

          {/* Savings Wallets */}
          {wallets.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>{t.dashboard.savingsWallets}</Text>
                <Pressable onPress={() => router.push("/(tabs)/savings")}>
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>{t.dashboard.showMore}</Text>
                </Pressable>
              </View>
              <View style={{ gap: 10 }}>
                {wallets.slice(0, 3).map((w) => (
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

      {payingCommitment && (
        <PayNowModal commitmentId={payingCommitment} onClose={() => setPayingCommitment(null)} />
      )}
    </View>
  );
}
