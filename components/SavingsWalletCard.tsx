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
  const { theme, language, t, isRTL } = useApp();

  const isGoal = wallet.type === "goal_savings";
  const progress = isGoal && wallet.target_amount ? wallet.current_amount / wallet.target_amount : 0;
  const daysLeft = wallet.target_date ? getDaysRemaining(wallet.target_date) : null;
  const remaining = wallet.target_amount ? wallet.target_amount - wallet.current_amount : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        borderRadius: 20,
        overflow: "hidden",
      })}
    >
      <View style={{ backgroundColor: wallet.color, padding: 16, paddingBottom: isGoal ? 14 : 16 }}>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <Feather name={wallet.icon as any} size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
              {getDisplayName(wallet, language)}
            </Text>
            {daysLeft !== null && daysLeft > 0 && (
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: isRTL ? "right" : "left" }}>
                {daysLeft} {t.savings.daysLeft}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>
              {formatCurrency(wallet.current_amount, "QAR", language)}
            </Text>
            {isGoal && wallet.target_amount && (
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                / {formatCurrency(wallet.target_amount, "QAR", language)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {isGoal && wallet.target_amount && (
        <View style={{ padding: 14, gap: 8 }}>
          <ProgressBar progress={Math.min(progress, 1)} color={wallet.color} height={5} />
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {Math.round(progress * 100)}%
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {t.savings.remaining}: {formatCurrency(Math.max(0, remaining), "QAR", language)}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
