import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useSavings } from "@/store/SavingsContext";
import { SavingsWalletCard } from "@/components/SavingsWalletCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/utils/currency";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function SavingsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark, settings } = useApp();
  const { wallets, totalSavings } = useSavings();

  const generalWallets = wallets.filter((w) => w.type === "general_savings" && !w.is_archived);
  const goalWallets = wallets.filter((w) => w.type === "goal_savings" && !w.is_archived);

  const totalGoal = goalWallets.reduce((s, w) => s + (w.target_amount || 0), 0);
  const totalGoalReached = goalWallets.reduce((s, w) => s + w.current_amount, 0);
  const overallGoalProgress = totalGoal > 0 ? totalGoalReached / totalGoal : 0;

  const primaryCurrency = settings.default_currency || "QAR";
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 20;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 110),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          style={{
            backgroundColor: isDark ? "#132825" : theme.primary,
            paddingTop: topPadding,
            paddingHorizontal: 20,
            paddingBottom: 28,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            gap: 20,
          }}
        >
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>{t.savings.title}</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(modals)/saving-wallet-form"); }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="plus" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Total Savings */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{t.savings.totalSavings}</Text>
            <Text style={{ fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -1 }}>
              {formatCurrency(totalSavings, primaryCurrency, language)}
            </Text>
          </View>

          {/* Goal Progress */}
          {goalWallets.length > 0 && totalGoal > 0 && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                  <Feather name="target" size={13} color="rgba(255,255,255,0.6)" />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>
                    {t.savings.goals}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.income }}>
                  {Math.round(overallGoalProgress * 100)}%
                </Text>
              </View>
              <ProgressBar progress={overallGoalProgress} color={theme.income} height={5} trackColor="rgba(255,255,255,0.15)" />
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {formatCurrency(totalGoalReached, primaryCurrency, language)}
                </Text>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {formatCurrency(totalGoal, primaryCurrency, language)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>
          {/* General Savings */}
          {generalWallets.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.savings.general}
              </Text>
              <View style={{ gap: 10 }}>
                {generalWallets.map((w) => (
                  <SavingsWalletCard key={w.id} wallet={w} onPress={() => router.push(`/savings/${w.id}`)} />
                ))}
              </View>
            </View>
          )}

          {/* Goal Savings */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>{t.savings.goals}</Text>
            </View>
            {goalWallets.length === 0 ? (
              <EmptyState
                icon="target"
                title={t.savings.noWallets}
                action={
                  <Pressable
                    onPress={() => router.push("/(modals)/saving-wallet-form")}
                    style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>{t.savings.add}</Text>
                  </Pressable>
                }
              />
            ) : (
              <View style={{ gap: 10 }}>
                {goalWallets.map((w) => (
                  <SavingsWalletCard key={w.id} wallet={w} onPress={() => router.push(`/savings/${w.id}`)} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
