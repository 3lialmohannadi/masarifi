import React from "react";
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
import { usePlans } from "@/store/PlansContext";
import { useTransactions } from "@/store/TransactionsContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/utils/currency";
import { getDisplayName } from "@/utils/display";
import { formatDateShort } from "@/utils/date";

export default function PlansTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { plans, getPlanSpent } = usePlans();
  const { transactions } = useTransactions();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>
            {t.plans.title}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(modals)/plan-form");
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

        {plans.length === 0 ? (
          <EmptyState
            icon="target"
            title={t.plans.noPlans}
            action={
              <Pressable
                onPress={() => router.push("/(modals)/plan-form")}
                style={{
                  backgroundColor: theme.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.plans.add}</Text>
              </Pressable>
            }
          />
        ) : (
          plans.map((plan) => {
            const spent = getPlanSpent(plan.id, transactions);
            const progress = plan.total_budget > 0 ? spent / plan.total_budget : 0;
            const remaining = plan.total_budget - spent;

            return (
              <Pressable
                key={plan.id}
                onPress={() => router.push(`/plans/${plan.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? theme.cardSecondary : theme.card,
                  borderRadius: 18,
                  padding: 18,
                  gap: 14,
                  borderLeftWidth: 4,
                  borderLeftColor: plan.color || theme.plan,
                })}
              >
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: `${plan.color || theme.plan}20`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name={(plan.icon || "target") as any} size={20} color={plan.color || theme.plan} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                      {getDisplayName(plan, language)}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                      {formatDateShort(plan.start_date, language)} → {formatDateShort(plan.end_date, language)}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.textMuted} />
                </View>

                <View style={{ gap: 8 }}>
                  <ProgressBar progress={progress} color={plan.color || theme.plan} height={6} />
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                      {t.plans.spent}: {formatCurrency(spent, plan.currency, language)}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: remaining < 0 ? theme.expense : theme.text }}>
                      {t.plans.budget}: {formatCurrency(plan.total_budget, plan.currency, language)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
