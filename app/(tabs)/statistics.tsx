import React, { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Platform, Dimensions, ActivityIndicator } from "react-native";
import { StatisticsSkeleton } from "@/components/ui/Skeleton";
import Svg, { Circle, Path, G, Line, Rect, Defs, LinearGradient, Stop, Polyline, Polygon, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { useAccounts } from "@/store/AccountsContext";
import { useSavings } from "@/store/SavingsContext";
import { useBudgets } from "@/store/BudgetsContext";
import * as Haptics from "expo-haptics";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { buildTransactionsCSV, shareCSV, buildCSVFilename } from "@/utils/export";
import { useMonthPicker, MONTH_NAMES_AR, MONTH_NAMES_EN } from "@/hooks/useMonthPicker";
import type { Language } from "@/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = Math.min(SCREEN_WIDTH - 64, 340);

// ─── Donut / Pie Chart ───────────────────────────────────────────────────────
interface DonutSlice { amount: number; color: string; label: string; budget?: number; currency?: string; language?: Language; }
function DonutChart({ slices, totalAmount, currency, language, theme, isRTL }: {
  slices: DonutSlice[]; totalAmount: number; currency: string; language: Language; theme: any; isRTL?: boolean;
}) {
  const { t } = useApp();
  const R = 70; const r = 44; const cx = 90; const cy = 90; const size = 180;
  const total = slices.reduce((s, d) => s + d.amount, 0);
  if (total === 0) return null;

  let startAngle = -90;
  const paths: { d: string; color: string }[] = [];

  slices.forEach((slice) => {
    const sweep = (slice.amount / total) * 360;
    const endAngle = startAngle + sweep;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + R * Math.cos(toRad(startAngle));
    const y1 = cy + R * Math.sin(toRad(startAngle));
    const x2 = cx + R * Math.cos(toRad(endAngle));
    const y2 = cy + R * Math.sin(toRad(endAngle));
    const xi1 = cx + r * Math.cos(toRad(startAngle));
    const yi1 = cy + r * Math.sin(toRad(startAngle));
    const xi2 = cx + r * Math.cos(toRad(endAngle));
    const yi2 = cy + r * Math.sin(toRad(endAngle));
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
    paths.push({ d, color: slice.color });
    startAngle = endAngle;
  });

  const formattedTotal = formatCurrency(totalAmount, currency, language);
  const maxLabelLen = 8;
  const displayTotal = formattedTotal.length > maxLabelLen ? formattedTotal.slice(0, maxLabelLen) + "…" : formattedTotal;

  return (
    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
      <Svg width={size} height={size}>
        <G>
          {paths.map((p, i) => (
            <Path key={i} d={p.d} fill={p.color} />
          ))}
          <Circle cx={cx} cy={cy} r={r - 2} fill={theme.card} />
        </G>
        <SvgText x={cx} y={cy - 8} textAnchor="middle" fill={theme.textSecondary} fontSize={9} fontWeight="500">
          {t.statistics.total}
        </SvgText>
        <SvgText x={cx} y={cy + 10} textAnchor="middle" fill={theme.text} fontSize={11} fontWeight="700">
          {displayTotal}
        </SvgText>
      </Svg>
      <View style={{ flex: 1, gap: 8 }}>
        {slices.slice(0, 6).map((s, i) => {
          const hasBudget = s.budget != null && s.budget > 0;
          const budgetPct = hasBudget ? Math.min(s.amount / s.budget!, 1) : 0;
          const budgetColor = budgetPct >= 1 ? "#EF4444" : budgetPct >= 0.75 ? "#F59E0B" : theme.primary;
          const shortAmount = (v: number) => {
            const fmt = formatCurrency(v, currency, language);
            return fmt.length > 9 ? fmt.slice(0, 9) + "…" : fmt;
          };
          return (
            <View key={i} style={{ gap: 3 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
                <Text style={{ flex: 1, fontSize: 11, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>{s.label}</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: theme.text }}>
                  {Math.round((s.amount / total) * 100)}%
                </Text>
              </View>
              {hasBudget && (
                <View style={{ paddingStart: 16, gap: 2 }}>
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: "700", color: budgetColor }}>
                      {shortAmount(s.amount)}
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>/</Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>
                      {shortAmount(s.budget!)}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontSize: 9, color: budgetColor, fontWeight: "700" }}>
                      {Math.round(budgetPct * 100)}%
                    </Text>
                  </View>
                  <View style={{ height: 3, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" }}>
                    <View style={{ width: `${budgetPct * 100}%`, height: "100%", backgroundColor: budgetColor, borderRadius: 2 }} />
                  </View>
                </View>
              )}
            </View>
          );
        })}
        {slices.length > 6 && (
          <Text style={{ fontSize: 10, color: theme.textMuted }}>+{slices.length - 6} {t.statistics.others}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Bar Chart (Income vs Expense) ──────────────────────────────────────────
interface BarMonth { label: string; income: number; expense: number; }
function BarChart({ data, theme, isRTL }: { data: BarMonth[]; theme: any; isRTL: boolean }) {
  const chartH = 130; const chartW = CHART_WIDTH; const paddingBottom = 24; const paddingTop = 10;
  const barH = chartH - paddingBottom - paddingTop;
  const groupW = chartW / data.length;
  const barW = Math.max(groupW * 0.28, 6);
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const displayData = isRTL ? [...data].reverse() : data;

  return (
    <Svg width={chartW} height={chartH}>
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <Line
          key={pct}
          x1={0} y1={paddingTop + barH * (1 - pct)}
          x2={chartW} y2={paddingTop + barH * (1 - pct)}
          stroke={theme.border} strokeWidth={0.5} strokeDasharray="3,3"
        />
      ))}
      {displayData.map((d, i) => {
        const groupX = i * groupW + groupW / 2;
        const incH = Math.max((d.income / maxVal) * barH, d.income > 0 ? 3 : 0);
        const expH = Math.max((d.expense / maxVal) * barH, d.expense > 0 ? 3 : 0);
        const incX = groupX - barW - 2;
        const expX = groupX + 2;
        return (
          <G key={d.label}>
            <Rect x={incX} y={paddingTop + barH - incH} width={barW} height={incH} rx={3} fill="#22C55E99" />
            <Rect x={expX} y={paddingTop + barH - expH} width={barW} height={expH} rx={3} fill="#EF444499" />
            <SvgText x={groupX} y={chartH - 4} textAnchor="middle" fill={theme.textMuted} fontSize={9} fontWeight="500">
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Line Chart (Monthly Expense Trend) ─────────────────────────────────────
interface LineMonth { label: string; value: number; }
function LineChart({ data, color, theme, isRTL }: { data: LineMonth[]; color: string; theme: any; isRTL: boolean }) {
  const chartH = 120; const chartW = CHART_WIDTH; const padB = 24; const padT = 12; const padL = 8; const padR = 8;
  const plotW = chartW - padL - padR; const plotH = chartH - padB - padT;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const displayData = isRTL ? [...data].reverse() : data;
  const n = displayData.length;

  const pts = displayData.map((d, i) => ({
    x: padL + (i / (n - 1)) * plotW,
    y: padT + plotH * (1 - d.value / maxVal),
    label: d.label,
    value: d.value,
  }));

  const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = [
    `${pts[0].x},${padT + plotH}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${padT + plotH}`,
  ].join(" ");

  return (
    <Svg width={chartW} height={chartH}>
      <Defs>
        <LinearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>
      {[0, 0.5, 1].map((pct) => (
        <Line
          key={pct}
          x1={padL} y1={padT + plotH * (1 - pct)}
          x2={padL + plotW} y2={padT + plotH * (1 - pct)}
          stroke={theme.border} strokeWidth={0.5} strokeDasharray="3,3"
        />
      ))}
      <Polygon points={areaPoints} fill="url(#lineArea)" />
      <Polyline points={polyPoints} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          <Circle cx={p.x} cy={p.y} r={1.8} fill={theme.card} />
          <SvgText x={p.x} y={chartH - 4} textAnchor="middle" fill={theme.textMuted} fontSize={9} fontWeight="500">
            {p.label}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

// ─── Main Statistics Screen ──────────────────────────────────────────────────
export default function StatisticsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark, settings, showToast } = useApp();
  const { transactions, transfers, isLoaded: txLoaded } = useTransactions();
  const { getCategory, categories } = useCategories();
  const { accounts } = useAccounts();
  const { savingsTransactions, isLoaded: savingsLoaded } = useSavings();
  const { getBudgetForCategory } = useBudgets();
  const { month: selectedMonth, year: selectedYear, monthName, monthKey, goToPrev, goToNext } = useMonthPicker(language);

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
  const netSavings = totalIncome - totalExpense;

  const monthSavingsDeposited = useMemo(() =>
    savingsTransactions
      .filter((tx) => tx.date.startsWith(monthKey) && (tx.type === "deposit_internal" || tx.type === "deposit_external"))
      .reduce((s, tx) => s + tx.amount, 0),
    [savingsTransactions, monthKey]
  );
  const monthRemaining = netSavings - monthSavingsDeposited;

  const monthSavingsWithdrawn = useMemo(() =>
    savingsTransactions
      .filter((tx) => tx.date.startsWith(monthKey) && (tx.type === "withdraw_internal" || tx.type === "withdraw_external"))
      .reduce((s, tx) => s + tx.amount, 0),
    [savingsTransactions, monthKey]
  );
  const monthSavingsNet = monthSavingsDeposited - monthSavingsWithdrawn;

  const monthTransfers = useMemo(() =>
    transfers.filter((tf) => tf.date.startsWith(monthKey)),
    [transfers, monthKey]
  );

  // Category spending for pie chart + top list
  const categorySpending = useMemo(() => {
    const spending: Record<string, { amount: number; category: ReturnType<typeof getCategory> }> = {};
    monthTxs.filter((tx) => tx.type === "expense" && tx.category_id).forEach((tx) => {
      const catId = tx.category_id!;
      if (!spending[catId]) spending[catId] = { amount: 0, category: getCategory(catId) };
      spending[catId].amount += tx.amount;
    });
    return Object.entries(spending)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxs, getCategory]);

  // Donut chart slices
  const pieSlices = useMemo<DonutSlice[]>(() =>
    categorySpending.map(({ id, amount, category }) => {
      const budgetEntry = getBudgetForCategory(id, monthKey);
      return {
        amount,
        color: category?.color || theme.expense,
        label: category ? getDisplayName(category, language) : id,
        budget: budgetEntry?.amount,
      };
    }),
    [categorySpending, language, theme.expense, getBudgetForCategory, monthKey]
  );

  // Last 6 months data (for bar + line charts)
  const trend6 = useMemo(() => {
    const months: BarMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      while (m <= 0) { m += 12; y--; }
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const txs = transactions.filter((tx) => tx.date.startsWith(key));
      const inc = txs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
      const exp = txs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
      const label = language === "ar" ? MONTH_NAMES_AR[m - 1].slice(0, 3) : MONTH_NAMES_EN[m - 1].slice(0, 3);
      months.push({ label, income: inc, expense: exp });
    }
    return months;
  }, [transactions, selectedMonth, selectedYear, language]);

  const lineData = useMemo<LineMonth[]>(() =>
    trend6.map((d) => ({ label: d.label, value: d.expense })),
    [trend6]
  );

  const primaryCurrency = settings.default_currency || accounts.find((a) => a.is_active)?.currency || "QAR";
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 20;
  const hasExpenses = totalExpense > 0;

  const [exporting, setExporting] = useState(false);
  const handleExportCSV = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const csv = buildTransactionsCSV(monthTxs, monthTransfers, accounts, categories, t, language);
      const filename = buildCSVFilename(`masarifi-${monthKey}`);
      await shareCSV(csv, filename);
      showToast(t.settings.exportCSVSuccess, "success");
    } catch {
      showToast(language === "ar" ? "تعذّر تصدير الملف" : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }, [exporting, monthTxs, monthTransfers, accounts, categories, language, monthName, selectedYear, showToast, t]);

  if (!txLoaded || !savingsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ width: 140, height: 30, borderRadius: 8, backgroundColor: theme.card }} />
        </View>
        <StatisticsSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <View style={{
          backgroundColor: isDark ? "#132825" : theme.primary,
          paddingTop: topPadding,
          paddingHorizontal: 20,
          paddingBottom: 28,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          gap: 16,
        }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>{t.statistics.title}</Text>

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
            <View style={{ flex: 1, marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.statistics.netSavings}</Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: netSavings >= 0 ? "#22C55E" : "#EF4444", marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
                {netSavings >= 0 ? "+" : ""}{formatCurrency(netSavings, primaryCurrency, language)}
              </Text>
            </View>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: (netSavings >= 0 ? "#22C55E" : "#EF4444") + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name={netSavings >= 0 ? "trending-up" : "trending-down"} size={26} color={netSavings >= 0 ? "#22C55E" : "#EF4444"} />
            </View>
          </View>

          {/* Income / Expense quick stats */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(34,197,94,0.12)", borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: "rgba(34,197,94,0.2)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5 }}>
                <Feather name="arrow-down-left" size={13} color="#22C55E" />
                <Text style={{ fontSize: 11, color: "#22C55E", fontWeight: "600" }}>{t.transactions.income}</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#22C55E" }} numberOfLines={1}>
                {formatCurrency(totalIncome, primaryCurrency, language)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 14, padding: 14, gap: 4, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5 }}>
                <Feather name="arrow-up-right" size={13} color="#EF4444" />
                <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>{t.transactions.expense}</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#EF4444" }} numberOfLines={1}>
                {formatCurrency(totalExpense, primaryCurrency, language)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 20 }}>

          {/* ── Monthly Summary ── */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
              {t.statistics.monthlySummary}
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 10 }}>
              {[
                { label: t.statistics.income, value: totalIncome, color: "#22C55E", icon: "arrow-down-left" },
                { label: t.statistics.expense, value: totalExpense, color: "#EF4444", icon: "arrow-up-right" },
                { label: t.statistics.savings, value: monthSavingsDeposited, color: theme.primary, icon: "archive" },
                { label: t.statistics.remaining, value: monthRemaining, color: monthRemaining >= 0 ? "#3B82F6" : "#F59E0B", icon: monthRemaining >= 0 ? "pocket" : "alert-circle" },
              ].map((item) => (
                <View key={item.label} style={{ flex: 1, minWidth: "44%", backgroundColor: item.color + "12", borderRadius: 14, padding: 13, gap: 5, borderWidth: 1, borderColor: item.color + "25" }}>
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: item.color + "20", alignItems: "center", justifyContent: "center" }}>
                      <Feather name={item.icon as any} size={12} color={item.color} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: item.color }}>{item.label}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: item.color }} numberOfLines={1}>
                    {formatCurrency(item.value, primaryCurrency, language)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Monthly Report Section ── */}
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, gap: 14 }}>
            {/* Header row */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.primary + "18", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="file-text" size={16} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text }}>{t.statistics.monthlyReport}</Text>
              </View>
              {/* CSV export button */}
              <Pressable
                onPress={handleExportCSV}
                disabled={exporting}
                style={({ pressed }) => ({
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: pressed ? theme.primary + "30" : theme.primary + "18",
                })}
              >
                {exporting
                  ? <ActivityIndicator size={13} color={theme.primary} />
                  : <Feather name="download" size={13} color={theme.primary} />}
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}>CSV</Text>
              </Pressable>
            </View>

            {/* Metrics row: savings net + transaction count */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: theme.background, borderRadius: 12, padding: 12, gap: 4 }}>
                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                  {language === "ar" ? "صافي التوفير" : "Savings Net"}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: monthSavingsNet >= 0 ? theme.primary : "#F59E0B", textAlign: isRTL ? "right" : "left" }}>
                  {formatCurrency(Math.abs(monthSavingsNet), primaryCurrency, language)}
                </Text>
                {monthSavingsNet < 0 && (
                  <Text style={{ fontSize: 10, color: "#F59E0B", textAlign: isRTL ? "right" : "left" }}>
                    {language === "ar" ? "سحب أكثر من الإيداع" : "More withdrawn"}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: theme.background, borderRadius: 12, padding: 12, gap: 4 }}>
                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                  {language === "ar" ? "المعاملات" : "Transactions"}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                  {monthTxs.length + monthTransfers.length}
                </Text>
                <Text style={{ fontSize: 10, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                  {monthTxs.length}{language === "ar" ? " عملية + " : " txn + "}{monthTransfers.length}{language === "ar" ? " تحويل" : " tr"}
                </Text>
              </View>
            </View>

            {/* Top 3 spending categories */}
            {categorySpending.length > 0 ? (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                  {language === "ar" ? "أعلى 3 تصنيفات إنفاق" : "Top 3 Spending Categories"}
                </Text>
                {categorySpending.slice(0, 3).map(({ id, amount, category }) => {
                  const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                  const catName = category ? getDisplayName(category, language) : id;
                  const catColor = category?.color || theme.expense;
                  return (
                    <View key={id} style={{ gap: 5 }}>
                      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 7, flex: 1 }}>
                          {category && (
                            <CategoryIcon
                              name={category.icon}
                              color={catColor}
                              size={14}
                            />
                          )}
                          <Text style={{ fontSize: 12, color: theme.text, fontWeight: "500" }} numberOfLines={1}>{catName}</Text>
                        </View>
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>{pct.toFixed(1)}%</Text>
                          <Text style={{ fontSize: 12, color: theme.text, fontWeight: "600" }}>
                            {formatCurrency(amount, primaryCurrency, language)}
                          </Text>
                        </View>
                      </View>
                      <View style={{ height: 5, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" }}>
                        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: catColor, borderRadius: 3 }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", paddingVertical: 4 }}>
                {language === "ar" ? "لا توجد مصروفات هذا الشهر" : "No expenses this month"}
              </Text>
            )}
          </View>

          {/* ── Expense by Category (Donut/Pie Chart) ── */}
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, gap: 14 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.expense + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="pie-chart" size={16} color={theme.expense} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text }}>{t.statistics.expenseByCategory}</Text>
            </View>
            {hasExpenses ? (
              <DonutChart
                slices={pieSlices}
                totalAmount={totalExpense}
                currency={primaryCurrency}
                language={language}
                theme={theme}
                isRTL={isRTL}
              />
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 28, gap: 8 }}>
                <Feather name="pie-chart" size={32} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>{t.statistics.noData}</Text>
              </View>
            )}
          </View>

          {/* ── Income vs Expense Bar Chart ── */}
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, gap: 14 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#3B82F615", alignItems: "center", justifyContent: "center" }}>
                <Feather name="bar-chart-2" size={16} color="#3B82F6" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text }}>{t.statistics.incomeVsExpense}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <BarChart data={trend6} theme={theme} isRTL={isRTL} />
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 16 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 12, height: 10, borderRadius: 2, backgroundColor: "#22C55E99" }} />
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>{t.transactions.income}</Text>
              </View>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 12, height: 10, borderRadius: 2, backgroundColor: "#EF444499" }} />
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>{t.transactions.expense}</Text>
              </View>
            </View>
          </View>

          {/* ── Monthly Expense Line Chart ── */}
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, gap: 14 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#F59E0B15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="trending-down" size={16} color="#F59E0B" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text }}>{t.statistics.monthlyExpense}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <LineChart data={lineData} color="#F59E0B" theme={theme} isRTL={isRTL} />
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 16 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: "#F59E0B" }} />
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>{t.statistics.expense} (6M)</Text>
              </View>
            </View>
          </View>

          {/* ── Top Spending Categories List ── */}
          {categorySpending.length > 0 ? (
            <>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.primary + "15", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="award" size={16} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>
                  {t.statistics.topCategories}
                </Text>
              </View>
              {categorySpending.slice(0, 8).map(({ id, amount, category }, idx) => {
                const percent = totalExpense > 0 ? amount / totalExpense : 0;
                const catColor = category?.color || theme.expense;
                return (
                  <View key={id} style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: catColor + "18", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 12, fontWeight: "800", color: catColor }}>#{idx + 1}</Text>
                      </View>
                      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: catColor + "18", alignItems: "center", justifyContent: "center" }}>
                        <CategoryIcon name={category?.icon || "tag"} size={18} color={catColor} />
                      </View>
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                          {category ? getDisplayName(category, language) : id}
                        </Text>
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                          <View style={{ flex: 1, height: 5, backgroundColor: theme.border, borderRadius: 3, overflow: "hidden" }}>
                            <View style={{ height: "100%", width: `${percent * 100}%`, backgroundColor: catColor, borderRadius: 3 }} />
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textMuted, minWidth: 32, textAlign: isRTL ? "left" : "right" }}>
                            {Math.round(percent * 100)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: catColor }}>
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
              <Text style={{ color: theme.textMuted, fontSize: 15, fontWeight: "500" }}>{t.statistics.noData}</Text>
            </View>
          )}

          {/* ── Account Balance Overview ── */}
          {accounts.filter((a) => a.is_active).length > 0 && (
            <>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#8B5CF615", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="credit-card" size={16} color="#8B5CF6" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>{t.statistics.accountsOverview}</Text>
              </View>
              {accounts.filter((a) => a.is_active).map((account) => {
                const acctIncome = monthTxs.filter((tx) => tx.account_id === account.id && tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
                const acctExpense = monthTxs.filter((tx) => tx.account_id === account.id && tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);
                return (
                  <View key={account.id} style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: account.color + "20", alignItems: "center", justifyContent: "center" }}>
                        <MaterialCommunityIcons name={account.icon as any} size={20} color={account.color} />
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
                          <Text style={{ fontSize: 12, fontWeight: "700", color: theme.income }} numberOfLines={1}>{formatCurrency(acctIncome, account.currency, language)}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: `${theme.expense}20`, borderRadius: 10, padding: 8, alignItems: "center" }}>
                          <Text style={{ fontSize: 10, color: theme.expense, fontWeight: "600" }}>{t.transactions.expense}</Text>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: theme.expense }} numberOfLines={1}>{formatCurrency(acctExpense, account.currency, language)}</Text>
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
