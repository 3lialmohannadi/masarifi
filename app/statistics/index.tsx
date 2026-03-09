import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { useAccounts } from "@/store/AccountsContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { getCurrentMonthYear } from "@/utils/date";

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { transactions } = useTransactions();
  const { getCategory } = useCategories();
  const { accounts } = useAccounts();
  const primaryCurrency = accounts.find((a) => a.is_active)?.currency || "QAR";
  const { month, year } = getCurrentMonthYear();

  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = language === "ar" ? MONTH_NAMES_AR[selectedMonth - 1] : MONTH_NAMES_EN[selectedMonth - 1];

  const monthTxs = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const totalIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;

  const categorySpending = useMemo(() => {
    const spending: Record<string, { amount: number; category: any }> = {};
    monthTxs.filter((tx) => tx.type === "expense").forEach((tx) => {
      if (!spending[tx.category_id]) {
        spending[tx.category_id] = { amount: 0, category: getCategory(tx.category_id) };
      }
      spending[tx.category_id].amount += tx.amount;
    });
    return Object.entries(spending)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxs]);

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 30,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
            {t.statistics.title}
          </Text>
        </View>

        {/* Month Navigator */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 16, padding: 4 }}>
          <Pressable onPress={prevMonth} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>{monthName} {selectedYear}</Text>
          <Pressable onPress={nextMonth} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: theme.incomeBackground, borderRadius: 16, padding: 14, gap: 4 }}>
            <Feather name="arrow-down-circle" size={20} color={theme.income} />
            <Text style={{ fontSize: 12, color: theme.income, fontWeight: "600" }}>{t.transactions.income}</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: theme.income }}>{formatCurrency(totalIncome, primaryCurrency, language)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.expenseBackground, borderRadius: 16, padding: 14, gap: 4 }}>
            <Feather name="arrow-up-circle" size={20} color={theme.expense} />
            <Text style={{ fontSize: 12, color: theme.expense, fontWeight: "600" }}>{t.transactions.expense}</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: theme.expense }}>{formatCurrency(totalExpense, primaryCurrency, language)}</Text>
          </View>
        </View>

        {/* Net Savings */}
        <View style={{
          backgroundColor: netSavings >= 0 ? theme.incomeBackground : theme.expenseBackground,
          borderRadius: 16,
          padding: 16,
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <View>
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>{t.statistics.netSavings}</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: netSavings >= 0 ? theme.income : theme.expense }}>
              {netSavings >= 0 ? "+" : ""}{formatCurrency(netSavings, primaryCurrency, language)}
            </Text>
          </View>
          <Feather name={netSavings >= 0 ? "trending-up" : "trending-down"} size={32} color={netSavings >= 0 ? theme.income : theme.expense} />
        </View>

        {/* Category Breakdown */}
        {categorySpending.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
              {t.statistics.topCategories}
            </Text>
            {categorySpending.map(({ id, amount, category }) => {
              const percent = totalExpense > 0 ? amount / totalExpense : 0;
              return (
                <View key={id} style={{ backgroundColor: theme.card, borderRadius: 14, padding: 14, gap: 8 }}>
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                    {category && (
                      <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: category.color + "20", alignItems: "center", justifyContent: "center" }}>
                        <Feather name={category.icon} size={18} color={category.color} />
                      </View>
                    )}
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: theme.text }}>
                      {category ? getDisplayName(category, language) : id}
                    </Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: theme.expense }}>
                        {formatCurrency(amount, primaryCurrency, language)}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                        {Math.round(percent * 100)}%
                      </Text>
                    </View>
                  </View>
                  <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${percent * 100}%`, backgroundColor: category?.color || theme.expense, borderRadius: 2 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {monthTxs.length === 0 && (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Feather name="bar-chart-2" size={48} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 12, fontSize: 15 }}>
              {t.statistics.noData}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
