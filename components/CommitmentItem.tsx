import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";
import type { Commitment } from "@/types";
import * as Haptics from "expo-haptics";

interface CommitmentItemProps {
  commitment: Commitment;
  onPayNow?: () => void;
  onPress?: () => void;
}

export function CommitmentItem({ commitment, onPayNow, onPress }: CommitmentItemProps) {
  const { theme, language, t, isRTL } = useApp();
  const { getAccount } = useAccounts();
  const { getCategory } = useCategories();

  const account = getAccount(commitment.account_id);
  const category = getCategory(commitment.category_id);
  const currency = account?.currency || "SAR";

  const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
    upcoming: { bg: theme.primaryLight, text: theme.primary, icon: "clock" },
    due_today: { bg: theme.warningBackground, text: theme.warningText, icon: "alert-circle" },
    overdue: { bg: theme.expenseBackground, text: theme.expense, icon: "alert-triangle" },
    paid: { bg: theme.incomeBackground, text: theme.income, icon: "check-circle" },
  };
  const statusInfo = statusColors[commitment.status] || statusColors.upcoming;
  const isOverdue = commitment.status === "overdue";
  const isDueToday = commitment.status === "due_today";
  const isPaid = commitment.status === "paid";

  const iconBgColor = isOverdue
    ? "#EF444420"
    : isDueToday
    ? "#F59E0B20"
    : isPaid
    ? theme.incomeBackground
    : `${theme.commitment}18`;

  const iconColor = isOverdue
    ? "#EF4444"
    : isDueToday
    ? "#F59E0B"
    : isPaid
    ? theme.income
    : theme.commitment;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 16,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: isOverdue ? "#EF444430" : isDueToday ? "#F59E0B30" : theme.border,
      })}
    >
      {/* Icon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: iconBgColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {category ? (
          <Feather name={(category.icon || "calendar") as any} size={20} color={iconColor} />
        ) : (
          <Feather name={commitment.recurrence_type !== "none" ? "repeat" : "calendar"} size={20} color={iconColor} />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
          {getDisplayName(commitment, language)}
        </Text>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <Text style={{ fontSize: 12, color: isOverdue ? theme.expense : theme.textSecondary }}>
            {formatDateShort(commitment.due_date, language)}
          </Text>
          {account && (
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              · {getDisplayName(account, language)}
            </Text>
          )}
          {commitment.recurrence_type !== "none" && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Feather name="repeat" size={10} color={theme.textMuted} />
              <Text style={{ fontSize: 11, color: theme.textMuted }}>
                {t.commitments.recurrenceTypes[commitment.recurrence_type]}
              </Text>
            </View>
          )}
        </View>
        {/* Status badge */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
          <View style={{ backgroundColor: statusInfo.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name={statusInfo.icon as any} size={10} color={statusInfo.text} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: statusInfo.text }}>
              {t.commitments.status[commitment.status]}
            </Text>
          </View>
          {commitment.is_manual && (
            <View style={{ backgroundColor: theme.card, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>
                {language === "ar" ? "يدوي" : "Manual"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Amount + Action */}
      <View style={{ alignItems: isRTL ? "flex-start" : "flex-end", gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: isPaid ? theme.income : theme.expense }}>
          {formatCurrency(commitment.amount, currency, language)}
        </Text>
        {!isPaid && onPayNow && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPayNow();
            }}
            style={{
              backgroundColor: theme.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              {t.commitments.payNow}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
