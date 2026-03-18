import React, { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { useAccounts } from "@/store/AccountsContext";
import { useSavings } from "@/store/SavingsContext";
import { useMonthPicker } from "@/hooks/useMonthPicker";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { buildTransactionsCSV, shareCSV, buildCSVFilename } from "@/utils/export";
import { CategoryIcon } from "@/components/CategoryIcon";

export default function MonthlyReportScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark, settings, showToast } = useApp();
  const { transactions, transfers, isLoaded: txLoaded } = useTransactions();
  const { getCategory, categories } = useCategories();
  const { accounts } = useAccounts();
  const { savingsTransactions, isLoaded: savingsLoaded } = useSavings();
  const { month, year, monthName, monthKey, goToPrev, goToNext } = useMonthPicker(language);
  const [exporting, setExporting] = useState(false);

  const primaryCurrency = settings.default_currency || accounts.find((a) => a.is_active)?.currency || "QAR";
  const topPadding = Platform.OS === "web" ? insets.top + 20 : insets.top + 16;

  const monthTxs = useMemo(() =>
    transactions.filter((tx) => tx.date.startsWith(monthKey)),
    [transactions, monthKey]
  );

  const totalIncome = useMemo(() =>
    monthTxs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0),
    [monthTxs]
  );
  const totalExpense = useMemo(() =>
    monthTxs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0),
    [monthTxs]
  );
  const netBalance = totalIncome - totalExpense;

  const monthSavingsNet = useMemo(() => {
    const deposited = savingsTransactions
      .filter((tx) =>
        tx.date.startsWith(monthKey) &&
        (tx.type === "deposit_internal" || tx.type === "deposit_external")
      )
      .reduce((s, tx) => s + tx.amount, 0);
    const withdrawn = savingsTransactions
      .filter((tx) =>
        tx.date.startsWith(monthKey) &&
        (tx.type === "withdraw_internal" || tx.type === "withdraw_external")
      )
      .reduce((s, tx) => s + tx.amount, 0);
    return deposited - withdrawn;
  }, [savingsTransactions, monthKey]);

  const monthTransfers = useMemo(() =>
    transfers.filter((tf) => tf.date.startsWith(monthKey)),
    [transfers, monthKey]
  );

  const categorySpending = useMemo(() => {
    const spending: Record<string, { amount: number; count: number }> = {};
    monthTxs.filter((tx) => tx.type === "expense" && tx.category_id).forEach((tx) => {
      const catId = tx.category_id!;
      if (!spending[catId]) spending[catId] = { amount: 0, count: 0 };
      spending[catId].amount += tx.amount;
      spending[catId].count += 1;
    });
    return Object.entries(spending)
      .map(([id, data]) => ({ id, ...data, category: getCategory(id) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [monthTxs, getCategory]);

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const csv = buildTransactionsCSV(
        monthTxs,
        monthTransfers,
        accounts,
        categories,
        t,
        language
      );
      const filename = buildCSVFilename(`masarifi-${monthKey}`);
      await shareCSV(csv, filename);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t.settings.exportCSVSuccess, "success");
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setExporting(false);
    }
  }, [monthTxs, monthTransfers, accounts, categories, t, language, monthKey, showToast]);

  const hasData = monthTxs.length > 0 || monthTransfers.length > 0;

  const netBalanceIcon: "trending-up" | "trending-down" = netBalance >= 0 ? "trending-up" : "trending-down";

  const summaryCards: { label: string; value: number; color: string; icon: "arrow-down-left" | "arrow-up-right" | "trending-up" | "trending-down" | "archive" }[] = [
    { label: t.statistics.income, value: totalIncome, color: theme.income, icon: "arrow-down-left" },
    { label: t.statistics.expense, value: totalExpense, color: theme.error, icon: "arrow-up-right" },
    { label: t.statistics.netSavings, value: netBalance, color: netBalance >= 0 ? "#3B82F6" : "#F59E0B", icon: netBalanceIcon },
    { label: t.statistics.savings, value: monthSavingsNet, color: monthSavingsNet >= 0 ? theme.primary : "#F59E0B", icon: "archive" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        paddingTop: topPadding,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          hitSlop={8}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
        >
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {t.statistics.monthlyReport}
        </Text>
        {hasData && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleExportCSV(); }}
            disabled={exporting}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
          >
            {exporting
              ? <ActivityIndicator size="small" color={theme.primary} />
              : <Feather name="download" size={17} color={theme.primary} />
            }
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 100), paddingTop: 20, paddingHorizontal: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Navigator */}
        <View style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          backgroundColor: isDark ? "#132825" : theme.primary,
          borderRadius: 18,
          overflow: "hidden",
          paddingVertical: 4,
        }}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); goToPrev(); }}
            style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: "#fff", textAlign: "center" }}>
            {monthName} {year}
          </Text>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); goToNext(); }}
            style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 10 }}>
          {summaryCards.map((card) => (
            <View
              key={card.label}
              style={{
                flex: 1,
                minWidth: "44%",
                backgroundColor: card.color + "14",
                borderRadius: 16,
                padding: 14,
                gap: 6,
                borderWidth: 1,
                borderColor: card.color + "28",
              }}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: card.color + "22", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={card.icon} size={13} color={card.color} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: card.color }}>{card.label}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: card.color }} numberOfLines={1}>
                {card.value >= 0 ? "" : "-"}{formatCurrency(Math.abs(card.value), primaryCurrency, language)}
              </Text>
            </View>
          ))}
        </View>

        {/* Transaction Count */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 16,
          padding: 16,
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 14,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: theme.primary + "18", alignItems: "center", justifyContent: "center" }}>
            <Feather name="list" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
              {language === "ar" ? "إجمالي المعاملات" : "Total Transactions"}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
              {monthTxs.length} {language === "ar" ? "معاملة" : "transactions"} · {monthTransfers.length} {language === "ar" ? "تحويل" : "transfers"}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.primary }}>
            {monthTxs.length + monthTransfers.length}
          </Text>
        </View>

        {/* Top Spending Categories */}
        {categorySpending.length > 0 && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.error + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="pie-chart" size={16} color={theme.error} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>{t.statistics.topCategories}</Text>
            </View>

            <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: theme.border }}>
              {categorySpending.map(({ id, amount, count, category }, index) => {
                const catColor = category?.color || theme.expense;
                const catName = category ? getDisplayName(category, language) : id;
                const percent = totalExpense > 0 ? amount / totalExpense : 0;
                return (
                  <View key={id} style={{ gap: 8 }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: catColor + "18", alignItems: "center", justifyContent: "center" }}>
                        {category?.icon
                          ? <CategoryIcon name={category.icon} size={17} color={catColor} />
                          : <Text style={{ fontSize: 14, fontWeight: "700", color: catColor }}>{index + 1}</Text>
                        }
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>{catName}</Text>
                          <Text style={{ fontSize: 13, fontWeight: "800", color: catColor }}>
                            {formatCurrency(amount, primaryCurrency, language)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                          <View style={{ flex: 1, height: 5, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" }}>
                            <View style={{ height: "100%", width: `${percent * 100}%`, backgroundColor: catColor, borderRadius: 3 }} />
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textMuted, minWidth: 32, textAlign: isRTL ? "left" : "right" }}>
                            {Math.round(percent * 100)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                    {index < categorySpending.length - 1 && (
                      <View style={{ height: 1, backgroundColor: theme.border, opacity: 0.6 }} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* No Data */}
        {!hasData && txLoaded && savingsLoaded && (
          <View style={{ alignItems: "center", paddingVertical: 64, gap: 14 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}>
              <Feather name="bar-chart-2" size={32} color={theme.textMuted} />
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 15, fontWeight: "500", textAlign: "center" }}>
              {t.statistics.noData}
            </Text>
          </View>
        )}

        {/* Export CSV Button */}
        {hasData && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleExportCSV(); }}
            disabled={exporting}
            style={({ pressed }) => ({
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 16,
              backgroundColor: pressed ? theme.cardSecondary : theme.card,
              borderWidth: 1,
              borderColor: theme.border,
            })}
          >
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#3B82F618", alignItems: "center", justifyContent: "center" }}>
              {exporting
                ? <ActivityIndicator size="small" color="#3B82F6" />
                : <Feather name="download" size={19} color="#3B82F6" />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.settings.exportCSV}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                {monthName} {year}
              </Text>
            </View>
            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={theme.border} />
          </Pressable>
        )}

      </ScrollView>
    </View>
  );
}
