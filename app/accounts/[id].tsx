import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { TransactionItem } from "@/components/TransactionItem";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AccountDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const account = accounts.find((a) => a.id === id);

  const accountTransactions = useMemo(() => {
    return [...transactions]
      .filter((tx) => tx.account_id === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, id]);

  const totalIncome = accountTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = accountTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  if (!account) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.textMuted }}>{language === "ar" ? "الحساب غير موجود" : "Account not found"}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={accountTransactions}
        keyExtractor={(tx) => tx.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: insets.top + 16, paddingBottom: 4 }}>
              <Pressable onPress={() => router.back()}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                  {getDisplayName(account, language)}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                  {t.accounts.types[account.type]}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(`/(modals)/account-form?id=${account.id}`)}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="edit-2" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Balance Card */}
            <View style={{ backgroundColor: account.color, borderRadius: 18, padding: 20, gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={account.icon as any} size={22} color="#fff" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{t.dashboard.totalBalance}</Text>
                  <Text style={{ fontSize: 30, fontWeight: "800", color: "#fff" }}>
                    {formatCurrency(account.balance, account.currency, language)}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.transactions.income}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#DCFCE7" }}>{formatCurrency(totalIncome, account.currency, language)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.transactions.expense}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#FEF9C3" }}>{formatCurrency(totalExpense, account.currency, language)}</Text>
                </View>
              </View>
            </View>

            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left", marginTop: 4 }}>
              {t.transactions.title}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionItem transaction={item} onPress={() => router.push(`/(modals)/add-transaction?id=${item.id}`)} />
        )}
        ListEmptyComponent={<EmptyState icon="repeat" title={t.transactions.noTransactions} />}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(modals)/add-transaction");
        }}
        style={{
          position: "absolute",
          bottom: insets.bottom + 24,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
