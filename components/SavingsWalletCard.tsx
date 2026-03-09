import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { getDaysRemaining } from "@/utils/date";
import type { SavingsWallet } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface SavingsWalletCardProps {
  wallet: SavingsWallet;
  onPress?: () => void;
}

export function SavingsWalletCard({ wallet, onPress }: SavingsWalletCardProps) {
  const { theme, language, t } = useApp();

  const progress =
    wallet.type === "goal_savings" && wallet.target_amount
      ? wallet.current_amount / wallet.target_amount
      : 0;

  const daysLeft = wallet.target_date ? getDaysRemaining(wallet.target_date) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderLeftWidth: 4,
        borderLeftColor: wallet.color,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: `${wallet.color}20`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={wallet.icon as any} size={20} color={wallet.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>
            {getDisplayName(wallet, language)}
          </Text>
          {daysLeft !== null && daysLeft > 0 && (
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {daysLeft} {t.savings.daysLeft}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: wallet.color }}>
            {formatCurrency(wallet.current_amount, "USD", language)}
          </Text>
          {wallet.target_amount && (
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              / {formatCurrency(wallet.target_amount, "USD", language)}
            </Text>
          )}
        </View>
      </View>

      {wallet.type === "goal_savings" && wallet.target_amount && (
        <>
          <ProgressBar progress={progress} color={wallet.color} height={6} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {Math.round(progress * 100)}%
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {t.savings.remaining}: {formatCurrency((wallet.target_amount || 0) - wallet.current_amount, "USD", language)}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}
