import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { getCurrentMonthYear } from "@/utils/date";

export default function StatisticsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark } = useApp();
  const { transactions } = useTransactions();
  const { getCategory } = useCategories();
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

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 20;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 110),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View
          style={{
            backgroundColor: isDark ? "#0D1B35" : "#1A1040",
            paddingTop: topPadding,
            paddingHorizontal: 20,
            paddingBottom: 28,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            gap: 18,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>
            {t.statistics.title}
          </Text>

          {/* Month Picker */}
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden" }}>
            <Pressable onPress={prevMonth} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
              <Feather name="chevron-left" size={20} color="rgba(255,255,255,0.8)" />
            </Pressable>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              {monthName} {selectedYear}
            </Text>
            <Pressable onPress={nextMonth} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>

          {/* Net Savings */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
            <View>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.statistics.netSavings}</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: netSavings >= 0 ? "#22C55E" : "#EF4444", marginTop: 2 }}>
                {netSavings >= 0 ? "+" : ""}{formatCurrency(netSavings, "QAR", language)}
              </Text>
            </View>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: (netSavings >= 0 ? "#22C55E" : "#EF4444") + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name={netSavings >= 0 ? "trending-up" : "trending-down"} size={26} color={netSavings >= 0 ? "#22C55E" : "#EF4444"} />
            </View>
          </View>

          {/* Income / Expense */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(34,197,94,0.12)", borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: "rgba(34,197,94,0.2)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather name="arrow-down-left" size={14} color="#22C55E" />
                <Text style={{ fontSize: 11, color: "#22C55E", fontWeight: "600" }}>{t.transactions.income}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#22C55E" }}>
                {formatCurrency(totalIncome, "QAR", language)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather name="arrow-up-right" size={14} color="#EF4444" />
                <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>{t.transactions.expense}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#EF4444" }}>
                {formatCurrency(totalExpense, "QAR", language)}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 12 }}>
          {categorySpending.length > 0 ? (
            <>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.statistics.topCategories}
              </Text>
              {categorySpending.map(({ id, amount, category }) => {
                const percent = totalExpense > 0 ? amount / totalExpense : 0;
                const catColor = category?.color || theme.expense;
                return (
                  <View key={id} style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: catColor + "18", alignItems: "center", justifyContent: "center" }}>
                        <Feather name={(category?.icon || "tag") as any} size={20} color={catColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                          {category ? getDisplayName(category, language) : id}
                        </Text>
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <View style={{ flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" }}>
                            <View style={{ height: "100%", width: `${percent * 100}%`, backgroundColor: catColor, borderRadius: 2 }} />
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textMuted, minWidth: 32, textAlign: "right" }}>
                            {Math.round(percent * 100)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: catColor }}>
                        {formatCurrency(amount, "QAR", language)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" }}>
                <Feather name="bar-chart-2" size={28} color={theme.textMuted} />
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 15, fontWeight: "500" }}>
                {t.statistics.noData}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
