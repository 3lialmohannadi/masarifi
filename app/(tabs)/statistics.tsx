import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { useAccounts } from "@/store/AccountsContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { useMonthPicker, MONTH_NAMES_AR, MONTH_NAMES_EN } from "@/hooks/useMonthPicker";

export default function StatisticsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark } = useApp();
  const { transactions } = useTransactions();
  const { getCategory } = useCategories();
  const { accounts } = useAccounts();

  const { month: selectedMonth, year: selectedYear, monthName, monthKey, goToPrev, goToNext } = useMonthPicker(language);

  const monthTxs = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(monthKey));
  }, [transactions, monthKey]);

  const totalIncome = monthTxs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = monthTxs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
  const netSavings = totalIncome - totalExpense;

  const categorySpending = useMemo(() => {
    const spending: Record<string, { amount: number; category: ReturnType<typeof getCategory> }> = {};
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

  // Last 6 months trend data
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      while (m <= 0) { m += 12; y--; }
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const txs = transactions.filter((tx) => tx.date.startsWith(key));
      const inc = txs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
      const exp = txs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
      const label = language === "ar" ? MONTH_NAMES_AR[m - 1].slice(0, 3) : MONTH_NAMES_EN[m - 1].slice(0, 3);
      months.push({ key, label, income: inc, expense: exp });
    }
    return months;
  }, [transactions, selectedMonth, selectedYear, language]);

  const maxTrendValue = Math.max(...trendData.map((d) => Math.max(d.income, d.expense)), 1);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 20;

  // Determine primary currency from active accounts
  const primaryCurrency = accounts.find((a) => a.is_active)?.currency || "QAR";

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
            <Pressable onPress={goToPrev} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
              <Feather name="chevron-left" size={20} color="rgba(255,255,255,0.8)" />
            </Pressable>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: "#fff", textAlign: "center" }}>
              {monthName} {selectedYear}
            </Text>
            <Pressable onPress={goToNext} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>

          {/* Net Savings */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
            <View>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.statistics.netSavings}</Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: netSavings >= 0 ? "#22C55E" : "#EF4444", marginTop: 2 }}>
                {netSavings >= 0 ? "+" : ""}{formatCurrency(netSavings, primaryCurrency, language)}
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
                {formatCurrency(totalIncome, primaryCurrency, language)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <Feather name="arrow-up-right" size={14} color="#EF4444" />
                <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>{t.transactions.expense}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#EF4444" }}>
                {formatCurrency(totalExpense, primaryCurrency, language)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 20 }}>
          {/* 6-Month Trend Chart */}
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, gap: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
              {t.statistics.trend6Months}
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-end", gap: 6, height: 100 }}>
              {trendData.map((d, i) => (
                <View key={d.key} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                  {/* Bars */}
                  <View style={{ width: "100%", alignItems: "center", justifyContent: "flex-end", height: 80, gap: 2, flexDirection: isRTL ? "row-reverse" : "row" }}>
                    <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
                      <View style={{ width: "80%", height: `${Math.max((d.income / maxTrendValue) * 100, 2)}%`, backgroundColor: "#22C55E" + "80", borderRadius: 3 }} />
                    </View>
                    <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
                      <View style={{ width: "80%", height: `${Math.max((d.expense / maxTrendValue) * 100, 2)}%`, backgroundColor: "#EF4444" + "80", borderRadius: 3 }} />
                    </View>
                  </View>
                  {/* Label */}
                  <Text style={{ fontSize: 9, color: theme.textMuted, fontWeight: "600" }}>{d.label}</Text>
                </View>
              ))}
            </View>
            {/* Legend */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 16 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: "#22C55E" }} />
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>{t.transactions.income}</Text>
              </View>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: "#EF4444" }} />
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>{t.transactions.expense}</Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          {categorySpending.length > 0 ? (
            <>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.statistics.topCategories}
              </Text>
              {categorySpending.slice(0, 8).map(({ id, amount, category }) => {
                const percent = totalExpense > 0 ? amount / totalExpense : 0;
                const catColor = category?.color || theme.expense;
                return (
                  <View key={id} style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: catColor + "18", alignItems: "center", justifyContent: "center" }}>
                        <Feather name={(category?.icon || "tag") as any} size={20} color={catColor} />
                      </View>
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                          {category ? getDisplayName(category, language) : id}
                        </Text>
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                          <View style={{ flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" }}>
                            <View style={{ height: "100%", width: `${percent * 100}%`, backgroundColor: catColor, borderRadius: 2 }} />
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textMuted, minWidth: 34, textAlign: isRTL ? "left" : "right" }}>
                            {Math.round(percent * 100)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: catColor }}>
                        {formatCurrency(amount, primaryCurrency, language)}
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

          {/* Account Balance Overview */}
          {accounts.filter((a) => a.is_active).length > 0 && (
            <>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.statistics.accountsOverview}
              </Text>
              {accounts.filter((a) => a.is_active).map((account) => {
                const acctIncome = monthTxs.filter((tx) => tx.account_id === account.id && tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
                const acctExpense = monthTxs.filter((tx) => tx.account_id === account.id && tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
                return (
                  <View key={account.id} style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: account.color + "20", alignItems: "center", justifyContent: "center" }}>
                        <Feather name={account.icon as any} size={20} color={account.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                          {getDisplayName(account, language)}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                          {formatCurrency(account.balance, account.currency, language)}
                        </Text>
                      </View>
                    </View>
                    {(acctIncome > 0 || acctExpense > 0) && (
                      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: `${theme.income}20`, borderRadius: 10, padding: 8, alignItems: "center" }}>
                          <Text style={{ fontSize: 10, color: theme.income, fontWeight: "600" }}>{t.transactions.income}</Text>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.income }}>{formatCurrency(acctIncome, account.currency, language)}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: `${theme.expense}20`, borderRadius: 10, padding: 8, alignItems: "center" }}>
                          <Text style={{ fontSize: 10, color: theme.expense, fontWeight: "600" }}>{t.transactions.expense}</Text>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.expense }}>{formatCurrency(acctExpense, account.currency, language)}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
