import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
import { SavingsSkeleton } from "@/components/ui/Skeleton";

export default function SavingsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark, settings } = useApp();
  const { wallets, totalSavings, isLoaded } = useSavings();

  const generalWallets = wallets.filter((w) => w.type === "general_savings" && !w.is_archived);
  const goalWallets = wallets.filter((w) => w.type === "goal_savings" && !w.is_archived);
  const goalWalletsWithTargets = goalWallets.filter((w) => !!w.target_amount && Number(w.target_amount) > 0);

  const totalGoal = goalWalletsWithTargets.reduce((s, w) => s + Number(w.target_amount!), 0);
  const totalGoalReached = goalWalletsWithTargets.reduce((s, w) => s + w.current_amount, 0);
  const overallGoalProgress = totalGoal > 0 ? Math.min(totalGoalReached / totalGoal, 1) : 0;

  const primaryCurrency = settings.default_currency || "QAR";
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ width: 120, height: 28, borderRadius: 8, backgroundColor: theme.card }} />
        </View>
        <SavingsSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={isDark
            ? ["#1A3630", "#0F2820", "#0A1C16"] as const
            : ["#2D8F83", "#1E6B63", "#165550"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: topPadding,
            paddingHorizontal: 20,
            paddingBottom: 32,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            gap: 20,
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <View style={{ position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)" }} />
          <View style={{ position: "absolute", bottom: -30, left: -20, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.04)" }} />

          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 }}>{t.savings.title}</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(modals)/saving-wallet-form"); }}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="plus" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Total Savings */}
          <View style={{ gap: 3 }}>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: "500", letterSpacing: 0.3, textAlign: isRTL ? "right" : "left" }}>
              {t.savings.totalSavings}
            </Text>
            <Text style={{ fontSize: 40, fontWeight: "800", color: "#fff", letterSpacing: -1, textAlign: isRTL ? "right" : "left" }}>
              {formatCurrency(totalSavings, primaryCurrency, language)}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: isRTL ? "right" : "left" }}>
              {wallets.filter((w) => !w.is_archived).length} {language === "ar" ? "محفظة" : "wallets"}
            </Text>
          </View>

          {/* Goal Progress */}
          {goalWalletsWithTargets.length > 0 && totalGoal > 0 && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                  <Feather name="target" size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                    {t.savings.goals}
                  </Text>
                </View>
                <View style={{ backgroundColor: "rgba(34,197,94,0.2)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#4ADE80" }}>
                    {Math.round(overallGoalProgress * 100)}%
                  </Text>
                </View>
              </View>
              <ProgressBar progress={overallGoalProgress} color="#4ADE80" height={6} trackColor="rgba(255,255,255,0.15)" />
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  {formatCurrency(totalGoalReached, primaryCurrency, language)}
                </Text>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  {formatCurrency(totalGoal, primaryCurrency, language)}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>
          {/* General Savings */}
          {generalWallets.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: theme.primary }} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                  {t.savings.general}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.border, marginHorizontal: 4 }} />
                <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: "500" }}>{generalWallets.length}</Text>
              </View>
              <View style={{ gap: 10 }}>
                {generalWallets.map((w) => (
                  <SavingsWalletCard key={w.id} wallet={w} onPress={() => router.push(`/savings/${w.id}`)} />
                ))}
              </View>
            </View>
          )}

          {/* Goal Savings */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: "#3B82F6" }} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>{t.savings.goals}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border, marginHorizontal: 4 }} />
              {goalWallets.length > 0 && <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: "500" }}>{goalWallets.length}</Text>}
            </View>
            {goalWallets.length === 0 ? (
              <EmptyState
                icon="target"
                title={t.savings.noWallets}
                subtitle={t.savings.addFirstWallet}
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
