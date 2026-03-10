import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, Platform } from "react-native";
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
  const { theme, t, language, isRTL, settings, isDark } = useApp();
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const { getCategory } = useCategories();
  const { accounts } = useAccounts();

  const { year: selectedYear, month: selectedMonth, monthName, monthKey, goToPrev, goToNext } = useMonthPicker(language);

  const primaryCurrency = settings.default_currency || accounts.find((a) => a.is_active)?.currency || "QAR";
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const budgetsWithSpending = useMemo((): BudgetWithSpent[] => {
    const currentBudgets = budgets.filter((b) => b.month === monthKey);
    return currentBudgets
      .map((budget) => {
        const spent = transactions
          .filter(
            (tx) =>
              tx.category_id === budget.category_id &&
              tx.type === "expense" &&
              tx.date.startsWith(monthKey)
          )
          .reduce((sum, tx) => sum + tx.amount, 0);
        return { ...budget, spent };
      })
      .sort((a, b) => {
        const progressA = a.amount > 0 ? a.spent / a.amount : 0;
        const progressB = b.amount > 0 ? b.spent / b.amount : 0;
        return progressB - progressA;
      });
  }, [budgets, transactions, monthKey]);

  const totalBudget = budgetsWithSpending.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithSpending.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const isOverall = overallProgress > 1;

  const overallBarColor = isOverall
    ? theme.expense
    : overallProgress > 0.8
    ? "#F97316"
    : theme.primary;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={budgetsWithSpending}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 34 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* ── Header ── */}
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                paddingTop: topPadding,
                paddingBottom: 4,
              }}
            >
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
              >
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  fontSize: 22,
                  fontWeight: "800",
                  color: theme.text,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {t.budget.title}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/(modals)/budget-form?monthKey=${monthKey}`);
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "#F59E0B",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="plus" size={20} color="#fff" />
              </Pressable>
            </View>

            {/* ── Month Navigator ── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: theme.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: "hidden",
              }}
            >
              <Pressable
                testID="budget-month-prev"
                onPress={goToPrev}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? theme.cardSecondary : "transparent",
                })}
              >
                <Feather name="chevron-left" size={22} color={theme.text} />
              </Pressable>
              <Text testID="budget-month-label" style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                {monthName} {selectedYear}
              </Text>
              <Pressable
                testID="budget-month-next"
                onPress={goToNext}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? theme.cardSecondary : "transparent",
                })}
              >
                <Feather name="chevron-right" size={22} color={theme.text} />
              </Pressable>
            </View>

            {/* ── Monthly Overview Card ── */}
            {budgetsWithSpending.length > 0 && (
              <View
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  padding: 16,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: isOverall ? theme.expense + "40" : theme.border,
                  ...(isDark ? {} : Platform.OS === "web"
                    ? { boxShadow: "0 2px 8px rgba(47,143,131,0.08)" }
                    : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }),
                }}
              >
                {/* Stats row: 3 columns */}
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: "space-between",
                  }}
                >
                  <StatColumn
                    label={t.budget.amount}
                    value={formatCurrency(totalBudget, primaryCurrency, language)}
                    color={theme.textSecondary}
                    theme={theme}
                    isRTL={isRTL}
                  />
                  <View style={{ width: 1, backgroundColor: theme.border }} />
                  <StatColumn
                    label={t.budget.spent}
                    value={formatCurrency(totalSpent, primaryCurrency, language)}
                    color={isOverall ? theme.expense : theme.text}
                    theme={theme}
                    isRTL={isRTL}
                  />
                  <View style={{ width: 1, backgroundColor: theme.border }} />
                  <StatColumn
                    label={t.budget.remaining}
                    value={formatCurrency(Math.max(0, totalRemaining), primaryCurrency, language)}
                    color={isOverall ? theme.expense : theme.income}
                    theme={theme}
                    isRTL={isRTL}
                  />
                </View>

                {/* Progress bar */}
                <ProgressBar
                  progress={Math.min(overallProgress, 1)}
                  color={overallBarColor}
                  height={8}
                />

                {/* Percentage + status */}
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    {Math.round(overallProgress * 100)}% {t.budget.percentUsed}
                  </Text>
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor: isOverall ? theme.expense + "15" : theme.income + "15",
                    }}
                  >
                    <Feather
                      name={isOverall ? "alert-triangle" : "check-circle"}
                      size={12}
                      color={isOverall ? theme.expense : theme.income}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isOverall ? theme.expense : theme.income,
                      }}
                    >
                      {isOverall ? t.budget.overBudget : t.budget.onTrack}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }: { item: BudgetWithSpent }) => {
          const category = getCategory(item.category_id);
          const progress = item.amount > 0 ? item.spent / item.amount : 0;
          const isOver = progress > 1;
          const isWarning = !isOver && progress > 0.8;
          const remaining = item.amount - item.spent;
          const barColor = isOver
            ? theme.expense
            : isWarning
            ? "#F97316"
            : theme.primary;

          return (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/(modals)/budget-form?id=${item.id}`);
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.cardSecondary : theme.card,
                borderRadius: 16,
                padding: 16,
                gap: 12,
                marginTop: 10,
                borderWidth: 1,
                borderColor: isOver ? theme.expense + "50" : theme.border,
                ...(isDark ? {} : Platform.OS === "web"
                  ? { boxShadow: "0 2px 8px rgba(47,143,131,0.08)" }
                  : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }),
              })}
            >
              {/* Top row: icon + name + % badge */}
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {category ? (
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: category.color + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name={category.icon as any} size={20} color={category.color} />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: theme.cardSecondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="tag" size={20} color={theme.textMuted} />
                  </View>
                )}

                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "700",
                    color: theme.text,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {category ? getDisplayName(category, language) : t.transactions.category}
                </Text>

                {/* Usage % badge */}
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: isOver
                      ? theme.expense + "15"
                      : isWarning
                      ? "#F9731615"
                      : theme.cardSecondary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: isOver ? theme.expense : isWarning ? "#F97316" : theme.text,
                    }}
                  >
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <ProgressBar progress={Math.min(progress, 1)} color={barColor} height={6} />

              {/* Stats: Budget / Spent / Remaining */}
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  justifyContent: "space-between",
                }}
              >
                <MiniStat
                  label={t.budget.limitAmount}
                  value={formatCurrency(item.amount, primaryCurrency, language)}
                  color={theme.textSecondary}
                  theme={theme}
                  isRTL={isRTL}
                />
                <MiniStat
                  label={t.budget.spent}
                  value={formatCurrency(item.spent, primaryCurrency, language)}
                  color={isOver ? theme.expense : theme.text}
                  theme={theme}
                  isRTL={isRTL}
                />
                <MiniStat
                  label={t.budget.remaining}
                  value={formatCurrency(Math.max(0, remaining), primaryCurrency, language)}
                  color={isOver ? theme.expense : theme.income}
                  theme={theme}
                  isRTL={isRTL}
                />
              </View>

              {/* Over budget alert */}
              {isOver && (
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: theme.expense + "10",
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Feather name="alert-triangle" size={13} color={theme.expense} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.expense,
                      fontWeight: "700",
                      flex: 1,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {t.budget.overBudget}:{" "}
                    {formatCurrency(item.spent - item.amount, primaryCurrency, language)}
                  </Text>
                </View>
              )}

              {/* Near-limit warning */}
              {isWarning && (
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#F9731610",
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Feather name="alert-circle" size={13} color="#F97316" />
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#F97316",
                      fontWeight: "700",
                      flex: 1,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {language === "ar"
                      ? `تجاوزت 80% من الميزانية`
                      : `80% of budget used`}
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
            subtitle={t.budget.addFirstBudget}
            action={
              <Pressable
                onPress={() => router.push(`/(modals)/budget-form?monthKey=${monthKey}`)}
                style={{
                  backgroundColor: "#F59E0B",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.budget.add}</Text>
              </Pressable>
            }
          />
        }
      />
    </View>
  );
}

function StatColumn({
  label,
  value,
  color,
  theme,
  isRTL,
}: {
  label: string;
  value: string;
  color: string;
  theme: any;
  isRTL: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: "center" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color, textAlign: "center" }}>{value}</Text>
    </View>
  );
}

function MiniStat({
  label,
  value,
  color,
  theme,
  isRTL,
}: {
  label: string;
  value: string;
  color: string;
  theme: any;
  isRTL: boolean;
}) {
  return (
    <View style={{ alignItems: isRTL ? "flex-end" : "flex-start", gap: 2 }}>
      <Text style={{ fontSize: 11, color: theme.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color }}>{value}</Text>
    </View>
  );
}
