import React, { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
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
import { AccountSelector } from "@/components/AccountSelector";
import { TransactionItem } from "@/components/TransactionItem";
import { CommitmentItem } from "@/components/CommitmentItem";
import { SavingsWalletCard } from "@/components/SavingsWalletCard";
import { formatCurrency } from "@/utils/currency";
import { getRemainingDaysInMonth } from "@/utils/date";
import { getDisplayName } from "@/utils/display";
import { EmptyState } from "@/components/ui/EmptyState";
import PayNowModal from "@/components/PayNowModal";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme, language, t, settings, selectedAccountId, isRTL } = useApp();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { allocatedMoneyForAccount, upcomingCommitments, payCommitment } = useCommitments();
  const { wallets } = useSavings();
  const [payingCommitment, setPayingCommitment] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const totalBalance = selectedAccount?.balance || 0;
  const allocatedMoney = selectedAccountId ? allocatedMoneyForAccount(selectedAccountId) : 0;
  const realAvailable = totalBalance - allocatedMoney;

  const remainingDays = getRemainingDaysInMonth();
  const dailyLimit =
    settings.daily_limit_mode === "manual"
      ? settings.manual_daily_limit
      : remainingDays > 0
      ? realAvailable / remainingDays
      : 0;

  const recentTransactions = useMemo(() => {
    const filtered = selectedAccountId
      ? transactions.filter((t) => t.account_id === selectedAccountId)
      : transactions;
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 3);
  }, [transactions, selectedAccountId]);

  const shownCommitments = upcomingCommitments.slice(0, 3);
  const currency = selectedAccount?.currency || "USD";

  const handleQuickAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(modals)/add-transaction");
  };

  const topPadding =
    Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 50 : 100),
          paddingHorizontal: 16,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>
              {t.app.name}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>
              {t.tabs.dashboard}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings/index")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="settings" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Account Selector */}
        <AccountSelector />

        {/* Balance Cards */}
        <View
          style={{
            backgroundColor: theme.primary,
            borderRadius: 20,
            padding: 20,
            gap: 20,
          }}
        >
          <View>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              {t.dashboard.totalBalance}
            </Text>
            <Text style={{ fontSize: 34, fontWeight: "800", color: "#fff", marginTop: 4 }}>
              {formatCurrency(totalBalance, currency, language)}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.15)",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                {t.dashboard.allocatedMoney}
              </Text>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#FEF9C3" }}>
                {formatCurrency(allocatedMoney, currency, language)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.15)",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                {t.dashboard.realAvailable}
              </Text>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#DCFCE7" }}>
                {formatCurrency(realAvailable, currency, language)}
              </Text>
            </View>
          </View>

          {/* Daily Limit */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                {t.dashboard.dailyLimit}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
                {formatCurrency(Math.max(0, dailyLimit), currency, language)}
                <Text style={{ fontSize: 13, fontWeight: "400" }}>/{language === "ar" ? "يوم" : "day"}</Text>
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                {settings.daily_limit_mode === "smart"
                  ? t.dashboard.smartLimit
                  : t.dashboard.manualLimit}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Add Button */}
        <Pressable
          onPress={handleQuickAdd}
          style={({ pressed }) => ({
            backgroundColor: pressed ? theme.primaryDark : theme.card,
            borderRadius: 14,
            padding: 16,
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
            borderStyle: "dashed",
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="plus" size={20} color="#fff" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.primary }}>
            {t.dashboard.quickAdd}
          </Text>
        </Pressable>

        {/* Recent Transactions */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
              {t.dashboard.recentTransactions}
            </Text>
            <Pressable onPress={() => router.push("/transactions/index")}>
              <Text style={{ fontSize: 14, color: theme.primary, fontWeight: "600" }}>
                {t.dashboard.showMore}
              </Text>
            </Pressable>
          </View>

          {recentTransactions.length === 0 ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                {t.dashboard.noTransactions}
              </Text>
            </View>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => router.push(`/(modals)/add-transaction?id=${tx.id}`)}
              />
            ))
          )}
        </View>

        {/* Upcoming Commitments */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
              {t.dashboard.upcomingCommitments}
            </Text>
            <Pressable onPress={() => router.push("/commitments/index")}>
              <Text style={{ fontSize: 14, color: theme.primary, fontWeight: "600" }}>
                {t.dashboard.showMore}
              </Text>
            </Pressable>
          </View>

          {shownCommitments.length === 0 ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                {t.dashboard.noCommitments}
              </Text>
            </View>
          ) : (
            shownCommitments.map((c) => (
              <CommitmentItem
                key={c.id}
                commitment={c}
                onPayNow={() => setPayingCommitment(c.id)}
              />
            ))
          )}
        </View>

        {/* Savings Wallets */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
              {t.dashboard.savingsWallets}
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/savings")}>
              <Text style={{ fontSize: 14, color: theme.primary, fontWeight: "600" }}>
                {t.dashboard.showMore}
              </Text>
            </Pressable>
          </View>

          {wallets.length === 0 ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                {t.dashboard.noSavings}
              </Text>
            </View>
          ) : (
            wallets.slice(0, 3).map((w) => (
              <SavingsWalletCard
                key={w.id}
                wallet={w}
                onPress={() => router.push(`/savings/${w.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {payingCommitment && (
        <PayNowModal
          commitmentId={payingCommitment}
          onClose={() => setPayingCommitment(null)}
        />
      )}
    </View>
  );
}
