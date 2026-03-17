import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

function darkenHex(hex: string, amount = 30): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, parseInt(clean.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(clean.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(clean.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export const SavingsWalletCard = React.memo(function SavingsWalletCard({ wallet, onPress }: SavingsWalletCardProps) {
  const { theme, language, t, isRTL, isDark, settings } = useApp();
  const currency = settings.default_currency;

  const isGoal = wallet.type === "goal_savings";
  const hasGoal = isGoal && !!wallet.target_amount && Number(wallet.target_amount) > 0;
  const progress = hasGoal
    ? Math.min(wallet.current_amount / Number(wallet.target_amount!), 1)
    : 0;
  const isComplete = hasGoal && progress >= 1;
  const daysLeft = wallet.target_date ? getDaysRemaining(wallet.target_date) : null;
  const remaining = hasGoal
    ? Math.max(0, Number(wallet.target_amount!) - wallet.current_amount)
    : 0;

  const darkerColor = darkenHex(wallet.color, 35);
  const gradientColors: [string, string] = [wallet.color, darkerColor];

  const shadowStyle = isDark ? {} : Platform.OS === "web"
    ? { boxShadow: "0 4px 16px rgba(47,143,131,0.10)" }
    : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 4 };

  return (
    <View style={[{ borderRadius: 22, borderWidth: 1, borderColor: theme.border }, shadowStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? theme.cardSecondary : theme.card,
          borderRadius: 22,
          overflow: "hidden",
          opacity: pressed ? 0.95 : 1,
        })}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18 }}
        >
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name={wallet.icon as any} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#fff",
                  textAlign: isRTL ? "right" : "left",
                }}
                numberOfLines={1}
              >
                {getDisplayName(wallet, language)}
              </Text>
              {isGoal && isComplete ? (
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 3,
                  }}
                >
                  <Feather name="check-circle" size={11} color="rgba(255,255,255,0.95)" />
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.95)", fontWeight: "700" }}>
                    {t.savings.completed}
                  </Text>
                </View>
              ) : isGoal && daysLeft !== null && daysLeft > 0 ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.8)",
                    textAlign: isRTL ? "right" : "left",
                    marginTop: 3,
                  }}
                >
                  {daysLeft} {t.savings.daysLeft}
                </Text>
              ) : !isGoal ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.65)",
                    textAlign: isRTL ? "right" : "left",
                    marginTop: 3,
                  }}
                >
                  {t.savings.types.general_savings}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>
                {formatCurrency(wallet.current_amount, currency, language)}
              </Text>
              {hasGoal && (
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  / {formatCurrency(Number(wallet.target_amount!), currency, language)}
                </Text>
              )}
            </View>
          </View>

          {hasGoal && (
            <View style={{ marginTop: 14 }}>
              <ProgressBar
                progress={progress}
                color={isComplete ? "#86efac" : "rgba(255,255,255,0.95)"}
                height={6}
                trackColor="rgba(255,255,255,0.25)"
              />
            </View>
          )}
        </LinearGradient>

        {/* Bottom info strip */}
        {hasGoal ? (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: isComplete ? theme.income : wallet.color,
                }}
              >
                {Math.round(progress * 100)}%
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "500" }}>
                {t.savings.completed}
              </Text>
            </View>
            <View style={{ width: 1, height: 32, backgroundColor: theme.border }} />
            <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "700", color: theme.text }}
                numberOfLines={1}
              >
                {formatCurrency(wallet.current_amount, currency, language)}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "500" }}>
                {t.savings.currentAmount}
              </Text>
            </View>
            <View style={{ width: 1, height: 32, backgroundColor: theme.border }} />
            <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: remaining > 0 ? theme.expense : theme.income,
                }}
                numberOfLines={1}
              >
                {formatCurrency(remaining, currency, language)}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "500" }}>
                {t.savings.remaining}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
              <Feather name="shield" size={13} color={theme.textMuted} />
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {t.savings.noGoal}
              </Text>
            </View>
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={14}
              color={wallet.color}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
});
