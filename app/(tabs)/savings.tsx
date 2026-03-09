import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
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

export default function SavingsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { wallets, totalSavings } = useSavings();

  const generalWallets = wallets.filter((w) => w.type === "general_savings" && !w.is_archived);
  const goalWallets = wallets.filter((w) => w.type === "goal_savings" && !w.is_archived);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>
            {t.savings.title}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(modals)/saving-wallet-form");
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Total Savings */}
        <View
          style={{
            backgroundColor: theme.savings,
            borderRadius: 20,
            padding: 20,
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            {t.savings.totalSavings}
          </Text>
          <Text style={{ fontSize: 32, fontWeight: "800", color: "#fff" }}>
            {formatCurrency(totalSavings, "USD", language)}
          </Text>
        </View>

        {/* General Savings */}
        {generalWallets.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
              {t.savings.general}
            </Text>
            {generalWallets.map((w) => (
              <SavingsWalletCard
                key={w.id}
                wallet={w}
                onPress={() => router.push(`/savings/${w.id}`)}
              />
            ))}
          </View>
        )}

        {/* Goal Wallets */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
              {t.savings.goals}
            </Text>
          </View>

          {goalWallets.length === 0 ? (
            <EmptyState
              icon="target"
              title={t.savings.noWallets}
              action={
                <Pressable
                  onPress={() => router.push("/(modals)/saving-wallet-form")}
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {t.savings.add}
                  </Text>
                </Pressable>
              }
            />
          ) : (
            goalWallets.map((w) => (
              <SavingsWalletCard
                key={w.id}
                wallet={w}
                onPress={() => router.push(`/savings/${w.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
