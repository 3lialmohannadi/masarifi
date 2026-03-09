import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useBudgets } from "@/store/BudgetsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { useAccounts } from "@/store/AccountsContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMonthPicker } from "@/hooks/useMonthPicker";
import type { Budget } from "@/types";

type BudgetWithSpent = Budget & { spent: number };

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const { getCategory } = useCategories();
  const { accounts } = useAccounts();

  const { year: selectedYear, monthName, monthKey, goToPrev, goToNext } = useMonthPicker(language);

  const primaryCurrency = accounts.find((a) => a.is_active)?.currency || "QAR";

  const budgetsWithSpending = useMemo((): BudgetWithSpent[] => {
    const currentBudgets = budgets.filter((b) => b.month === monthKey);
    return currentBudgets.map((budget) => {
      const spent = transactions
        .filter(
          (tx) =>
            tx.category_id === budget.category_id &&
            tx.type === "expense" &&
            tx.date.startsWith(monthKey)
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { ...budget, spent };
    });
  }, [budgets, transactions, monthKey]);

  const totalBudget = budgetsWithSpending.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithSpending.reduce((s, b) => s + b.spent, 0);
  const overallProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;

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
              <Pressable onPress={() => router.back()} hitSlop={8}>
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
              <Pressable onPress={goToPrev} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                <Feather name="chevron-left" size={20} color={theme.text} />
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                {monthName} {selectedYear}
              </Text>
              <Pressable onPress={goToNext} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                <Feather name="chevron-right" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Monthly Overview */}
            {budgetsWithSpending.length > 0 && (
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, gap: 10 }}>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t.budget.totalSpent}</Text>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: overallProgress > 1 ? theme.expense : theme.text }}>
                      {formatCurrency(totalSpent, primaryCurrency, language)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t.budget.ofBudget}</Text>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: theme.textSecondary }}>
                      {formatCurrency(totalBudget, primaryCurrency, language)}
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  progress={Math.min(overallProgress, 1)}
                  color={overallProgress > 1 ? theme.expense : overallProgress > 0.8 ? "#F97316" : theme.warning}
                  height={8}
                />
                <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                  {Math.round(overallProgress * 100)}% {t.budget.percentUsed}
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }: { item: BudgetWithSpent }) => {
          const category = getCategory(item.category_id);
          const progress = item.amount > 0 ? item.spent / item.amount : 0;
          const isOver = progress > 1;
          const barColor = isOver ? theme.expense : progress > 0.8 ? "#F97316" : theme.primary;

          return (
            <Pressable
              onPress={() => router.push(`/(modals)/budget-form?id=${item.id}`)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.cardSecondary : theme.card,
                borderRadius: 16,
                padding: 16,
                gap: 12,
                marginTop: 10,
                borderWidth: isOver ? 1 : 0,
                borderColor: isOver ? theme.expense + "40" : "transparent",
              })}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                {category ? (
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: category.color + "20", alignItems: "center", justifyContent: "center" }}>
                    <Feather name={category.icon as any} size={20} color={category.color} />
                  </View>
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: theme.cardSecondary, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="tag" size={20} color={theme.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                    {category ? getDisplayName(category, language) : t.transactions.category}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                    {formatCurrency(item.spent, primaryCurrency, language)} / {formatCurrency(item.amount, primaryCurrency, language)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: isOver ? theme.expense : theme.text }}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <ProgressBar progress={Math.min(progress, 1)} color={barColor} height={6} />
              {isOver && (
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                  <Feather name="alert-triangle" size={14} color={theme.expense} />
                  <Text style={{ fontSize: 12, color: theme.expense, fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
                    {t.budget.overBudget}: {formatCurrency(item.spent - item.amount, primaryCurrency, language)}
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
