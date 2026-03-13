import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import type { Debt } from "@/types";
import { formatCurrency } from "@/utils/currency";
import { DebtStatusBadge } from "./DebtStatusBadge";

interface Props {
  debt: Debt;
  onPress: () => void;
}

export function DebtCard({ debt, onPress }: Props) {
  const { theme, language, isRTL, t } = useApp();

  const progress = debt.original_amount > 0
    ? Math.min(1, debt.paid_amount / debt.original_amount)
    : 0;
  const progressPct = Math.round(progress * 100);

  const progressColor =
    debt.status === "completed"      ? "#059669" :
    debt.status === "overdue"        ? "#EF4444" :
    debt.status === "partially_paid" ? "#D97706" :
    debt.status === "cancelled"      ? "#6B7280" :
    theme.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 14,
          backgroundColor: debt.subcategory_color + "20",
          alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Feather name={debt.subcategory_icon as any} size={20} color={debt.subcategory_color} />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}
            numberOfLines={1}
          >
            {debt.entity_name}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
            {language === "ar" ? debt.subcategory_ar : debt.subcategory_en}
          </Text>
        </View>

        <View style={{ alignItems: isRTL ? "flex-start" : "flex-end", gap: 4 }}>
          <DebtStatusBadge status={debt.status} small />
        </View>
      </View>

      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>{t.debts.remaining}</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: debt.status === "overdue" ? "#EF4444" : theme.text }}>
            {formatCurrency(debt.remaining_amount, debt.currency, language)}
          </Text>
        </View>
        <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>{t.debts.totalPaid}</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#059669" }}>
            {formatCurrency(debt.paid_amount, debt.currency, language)}
          </Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 11, color: theme.textMuted }}>{t.debts.progress}</Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: progressColor }}>{progressPct}%</Text>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.cardSecondary, overflow: "hidden" }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: progressColor, width: `${progressPct}%` }} />
        </View>
      </View>

      <Feather
        name={isRTL ? "chevron-left" : "chevron-right"}
        size={16}
        color={theme.textMuted}
        style={{ position: "absolute", top: 16, right: isRTL ? undefined : 16, left: isRTL ? 16 : undefined }}
      />
    </Pressable>
  );
}
