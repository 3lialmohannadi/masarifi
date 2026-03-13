import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { formatCurrency } from "@/utils/currency";
import type { Debt } from "@/types";

interface Props {
  debts: Debt[];
  totalOriginal: number;
  totalPaid: number;
  totalRemaining: number;
  currency: string;
}

export function DebtStatistics({ debts, totalOriginal, totalPaid, totalRemaining, currency }: Props) {
  const { theme, language, isRTL, t } = useApp();

  const repaymentPct = totalOriginal > 0 ? Math.min(100, Math.round((totalPaid / totalOriginal) * 100)) : 0;
  const activeCount   = debts.filter((d) => d.status === "active").length;
  const overdueCount  = debts.filter((d) => d.status === "overdue").length;
  const completedCount = debts.filter((d) => d.status === "completed").length;
  const partialCount  = debts.filter((d) => d.status === "partially_paid").length;

  const progressColor =
    repaymentPct >= 80 ? "#059669" :
    repaymentPct >= 40 ? "#D97706" :
    "#EF4444";

  const rows: { label: string; value: string; color?: string }[] = [
    { label: language === "ar" ? "إجمالي المديونيات" : "Total Debts",     value: String(debts.length) },
    { label: t.debts.status.active,                                       value: String(activeCount),    color: "#2F8F83" },
    { label: t.debts.status.partially_paid,                               value: String(partialCount),   color: "#D97706" },
    { label: t.debts.status.overdue,                                      value: String(overdueCount),   color: "#EF4444" },
    { label: t.debts.status.completed,                                    value: String(completedCount), color: "#059669" },
    { label: t.debts.totalDebts,                                          value: formatCurrency(totalOriginal, currency, language) },
    { label: t.debts.totalPaid,                                           value: formatCurrency(totalPaid, currency, language),      color: "#059669" },
    { label: t.debts.remaining,                                           value: formatCurrency(totalRemaining, currency, language), color: "#EF4444" },
  ];

  return (
    <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.primary + "18", alignItems: "center", justifyContent: "center" }}>
          <Feather name="bar-chart-2" size={16} color={theme.primary} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>
          {language === "ar" ? "إحصائيات المديونيات" : "Debt Statistics"}
        </Text>
      </View>

      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>
            {language === "ar" ? "نسبة السداد الإجمالية" : "Overall Repayment Progress"}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: progressColor }}>{repaymentPct}%</Text>
        </View>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.cardSecondary, overflow: "hidden" }}>
          <View
            style={{
              height: 10,
              borderRadius: 5,
              backgroundColor: progressColor,
              width: `${repaymentPct}%`,
            }}
          />
        </View>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: "#059669", fontWeight: "600" }}>
            {formatCurrency(totalPaid, currency, language)}
          </Text>
          <Text style={{ fontSize: 11, color: theme.textMuted }}>
            {formatCurrency(totalOriginal, currency, language)}
          </Text>
        </View>
      </View>

      <View style={{ gap: 0, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: theme.border }}>
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: i % 2 === 0 ? "transparent" : theme.cardSecondary + "60",
            }}
          >
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>{row.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: row.color || theme.text }}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
