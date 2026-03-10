import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
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
  const { theme, language, t, isRTL, isDark } = useApp();

  const isGoal = wallet.type === "goal_savings";
  const hasGoal = isGoal && !!wallet.target_amount && Number(wallet.target_amount) > 0;
  const progress = hasGoal
    ? Math.min(wallet.current_amount / Number(wallet.target_amount!), 1)
    : 0;
  const daysLeft = wallet.target_date ? getDaysRemaining(wallet.target_date) : null;
  const remaining = hasGoal
    ? Math.max(0, Number(wallet.target_amount!) - wallet.current_amount)
    : 0;

  const shadowStyle = isDark ? {} : Platform.OS === "web"
    ? { boxShadow: "0 3px 12px rgba(47,143,131,0.09)" }
    : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 };

  return (
    <View style={[{ borderRadius: 20, borderWidth: 1, borderColor: theme.border }, shadowStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? theme.cardSecondary : theme.card,
          borderRadius: 20,
          overflow: "hidden",
        })}
      >
        {/* Colored Header */}
        <View style={{ backgroundColor: wallet.color, padding: 16 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" }}>
              <Feather name={wallet.icon as any} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
                {getDisplayName(wallet, language)}
              </Text>
              {isGoal && daysLeft !== null && daysLeft > 0 ? (
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", textAlign: isRTL ? "right" : "left", marginTop: 2 }}>
                  {daysLeft} {t.savings.daysLeft}
                </Text>
              ) : !isGoal ? (
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: isRTL ? "right" : "left", marginTop: 2 }}>
                  {t.savings.types.general_savings}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>
                {formatCurrency(wallet.current_amount, "QAR", language)}
              </Text>
              {hasGoal && (
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  / {formatCurrency(Number(wallet.target_amount!), "QAR", language)}
                </Text>
              )}
            </View>
          </View>

          {hasGoal && (
            <View style={{ marginTop: 12 }}>
              <ProgressBar
                progress={progress}
                color="rgba(255,255,255,0.9)"
                height={5}
                trackColor="rgba(255,255,255,0.25)"
              />
            </View>
          )}
        </View>

        {/* Bottom info strip */}
        {hasGoal ? (
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 }}>
            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: wallet.color }}>
                {Math.round(progress * 100)}%
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>
                {language === "ar" ? "مكتمل" : "done"}
              </Text>
            </View>
            <View style={{ width: 1, height: 30, backgroundColor: theme.border }} />
            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }} numberOfLines={1}>
                {formatCurrency(wallet.current_amount, "QAR", language)}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>{t.savings.currentAmount}</Text>
            </View>
            <View style={{ width: 1, height: 30, backgroundColor: theme.border }} />
            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "700", color: remaining > 0 ? theme.expense : theme.income }}
                numberOfLines={1}
              >
                {formatCurrency(remaining, "QAR", language)}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>{t.savings.remaining}</Text>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
              <Feather name="shield" size={13} color={theme.textMuted} />
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {language === "ar" ? "بدون هدف محدد" : "No target set"}
              </Text>
            </View>
            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={14} color={theme.primary} />
          </View>
        )}
      </Pressable>
    </View>
  );
}
