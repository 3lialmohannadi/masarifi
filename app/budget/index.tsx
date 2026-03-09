import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useBudgets } from "@/store/BudgetsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { getMonthKey, monthKeyToMonthYear, monthYearToMonthKey } from "@/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const { getCategory } = useCategories();

  const currentMonthKey = getMonthKey();
  const { month: curMonth, year: curYear } = monthKeyToMonthYear(currentMonthKey);
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [selectedYear, setSelectedYear] = useState(curYear);

  const selectedMonthKey = monthYearToMonthKey(selectedMonth, selectedYear);

  const currentBudgets = useMemo(() => {
    return budgets.filter((b) => b.month === selectedMonthKey);
  }, [budgets, selectedMonthKey]);

  const budgetsWithSpending = useMemo(() => {
    return currentBudgets.map((budget) => {
      const spent = transactions
        .filter(
          (tx) =>
            tx.category_id === budget.category_id &&
            tx.type === "expense" &&
            tx.date.startsWith(selectedMonthKey)
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { ...budget, spent };
    });
  }, [currentBudgets, transactions, selectedMonthKey]);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = language === "ar" ? MONTH_NAMES_AR[selectedMonth - 1] : MONTH_NAMES_EN[selectedMonth - 1];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={budgetsWithSpending}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Header */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: insets.top + 16, paddingBottom: 4 }}>
              <Pressable onPress={() => router.back()}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
              </Pressable>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.budget.title}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(modals)/budget-form");
                }}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="plus" size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Month Navigator */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 16, padding: 4 }}>
              <Pressable onPress={prevMonth} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                <Feather name="chevron-left" size={20} color={theme.text} />
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                {monthName} {selectedYear}
              </Text>
              <Pressable onPress={nextMonth} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                <Feather name="chevron-right" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const category = getCategory(item.category_id);
          const progress = item.amount > 0 ? item.spent / item.amount : 0;
          const isOver = progress > 1;
          const barColor = isOver ? "#EF4444" : progress > 0.8 ? "#F97316" : theme.primary;
          const currency = category ? "QAR" : "QAR";

          return (
            <Pressable
              onPress={() => router.push(`/(modals)/budget-form?id=${item.id}`)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.cardSecondary : theme.card,
                borderRadius: 16,
                padding: 16,
                gap: 12,
                marginTop: 10,
              })}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                {category && (
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: category.color + "20", alignItems: "center", justifyContent: "center" }}>
                    <Feather name={category.icon as any} size={20} color={category.color} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>
                    {category ? getDisplayName(category, language) : t.transactions.category}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                    {formatCurrency(item.spent, currency, language)} / {formatCurrency(item.amount, currency, language)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: isOver ? "#EF4444" : theme.text }}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <ProgressBar progress={Math.min(progress, 1)} color={barColor} height={6} />
              {isOver && (
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                  <Feather name="alert-triangle" size={14} color="#EF4444" />
                  <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "600" }}>
                    {t.budget.overBudget}: {formatCurrency(item.spent - item.amount, currency, language)}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="pie-chart"
            title={t.budget.noBudgets}
            action={
              <Pressable
                onPress={() => router.push("/(modals)/budget-form")}
                style={{ backgroundColor: "#F59E0B", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.budget.add}</Text>
              </Pressable>
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
