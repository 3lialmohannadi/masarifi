import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";
import type { Commitment } from "@/types";
import { Badge } from "@/components/ui/Badge";
import * as Haptics from "expo-haptics";

interface CommitmentItemProps {
  commitment: Commitment;
  onPayNow?: () => void;
  onPress?: () => void;
}

export function CommitmentItem({ commitment, onPayNow, onPress }: CommitmentItemProps) {
  const { theme, language, t } = useApp();
  const { getAccount } = useAccounts();

  const account = getAccount(commitment.account_id);

  const statusColors = {
    upcoming: { bg: theme.primaryLight, text: theme.primary },
    due_today: { bg: theme.warningBackground, text: theme.warningText },
    overdue: { bg: theme.expenseBackground, text: theme.expense },
    paid: { bg: theme.incomeBackground, text: theme.income },
  };
  const statusColor = statusColors[commitment.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        marginBottom: 6,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${theme.warning}20`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="calendar" size={20} color={theme.warning} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }} numberOfLines={1}>
          {getDisplayName(commitment, language)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {formatDateShort(commitment.due_date, language)}
          </Text>
          {account && (
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              · {getDisplayName(account, language)}
            </Text>
          )}
        </View>
        <Badge
          label={t.commitments.status[commitment.status]}
          color={statusColor.bg}
          textColor={statusColor.text}
        />
      </View>
      <View style={{ alignItems: "flex-end", gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.expense }}>
          {formatCurrency(commitment.amount, account?.currency || "USD", language)}
        </Text>
        {commitment.status !== "paid" && onPayNow && (
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
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              {t.commitments.payNow}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
