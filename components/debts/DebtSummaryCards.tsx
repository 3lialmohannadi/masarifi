import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { formatCurrency } from "@/utils/currency";

interface Props {
  totalOriginal: number;
  totalPaid: number;
  totalRemaining: number;
  activeCount: number;
  currency: string;
}

export function DebtSummaryCards({ totalOriginal, totalPaid, totalRemaining, activeCount, currency }: Props) {
  const { theme, language, isRTL, t } = useApp();

  const cards = [
    {
      label: t.debts.totalDebts,
      value: formatCurrency(totalOriginal, currency, language),
      icon: "credit-card" as const,
      color: "#3B82F6",
    },
    {
      label: t.debts.totalPaid,
      value: formatCurrency(totalPaid, currency, language),
      icon: "check-circle" as const,
      color: "#059669",
    },
    {
      label: t.debts.remaining,
      value: formatCurrency(totalRemaining, currency, language),
      icon: "clock" as const,
      color: "#EF4444",
    },
    {
      label: t.debts.activeCount,
      value: String(activeCount),
      icon: "activity" as const,
      color: theme.primary,
    },
  ];

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {cards.map((card) => (
        <View
          key={card.label}
          style={{
            flex: 1,
            minWidth: "45%",
            backgroundColor: theme.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 14,
            gap: 8,
          }}
        >
          <View style={{
            width: 36, height: 36, borderRadius: 11,
            backgroundColor: card.color + "18",
            alignItems: "center", justifyContent: "center",
            alignSelf: isRTL ? "flex-end" : "flex-start",
          }}>
            <Feather name={card.icon} size={18} color={card.color} />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? "right" : "left", marginBottom: 2 }}>
              {card.label}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
              {card.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
