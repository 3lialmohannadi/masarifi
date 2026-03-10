import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
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
import type { Plan } from "@/types";

interface PlanRowData {
  plan: Plan;
  spent: number;
  progress: number;
  remaining: number;
  isOver: boolean;
  planColor: string;
}

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark } = useApp();
  const { plans, getPlanSpent } = usePlans();
  const { transactions } = useTransactions();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const planRows = useMemo<PlanRowData[]>(() =>
    plans.map((plan) => {
      const spent = getPlanSpent(plan.id, transactions);
      const progress = plan.total_budget > 0 ? Math.min(spent / plan.total_budget, 1) : 0;
      const remaining = plan.total_budget - spent;
      const isOver = spent > plan.total_budget;
      const planColor = plan.color || theme.plan;
      return { plan, spent, progress, remaining, isOver, planColor };
    }),
    [plans, transactions, getPlanSpent, theme.plan]
  );

  const keyExtractor = useCallback((item: PlanRowData) => item.plan.id, []);

  const renderItem = useCallback(({ item }: { item: PlanRowData }) => {
    const { plan, spent, progress, remaining, isOver, planColor } = item;
    return (
      <Pressable
        onPress={() => router.push(`/plans/${plan.id}`)}
        style={({ pressed }) => ({
          backgroundColor: pressed ? theme.cardSecondary : theme.card,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.border,
          ...(isDark ? {} : Platform.OS === "web"
            ? { boxShadow: "0 2px 10px rgba(47,143,131,0.10)" }
            : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }),
        })}
      >
        <View style={{ backgroundColor: planColor, padding: 16, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <CategoryIcon name={plan.icon || "chart-line"} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
              {getDisplayName(plan, language)}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: isRTL ? "right" : "left" }}>
              {formatDateShort(plan.start_date, language)} → {formatDateShort(plan.end_date, language)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.plans.budget}</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
              {formatCurrency(plan.total_budget, plan.currency, language)}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          <ProgressBar progress={progress} color={isOver ? "#EF4444" : planColor} height={6} />
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
              <Feather name="arrow-up-right" size={13} color={theme.expense} />
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                {t.plans.spent}: <Text style={{ fontWeight: "700", color: theme.expense }}>{formatCurrency(spent, plan.currency, language)}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: isOver ? "#EF4444" : theme.primary }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
          {isOver && (
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: theme.expenseBackground, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }}>
              <Feather name="alert-triangle" size={13} color={theme.expense} />
              <Text style={{ fontSize: 12, color: theme.expense, fontWeight: "600" }}>
                {t.plans.overBudgetBy} {formatCurrency(Math.abs(remaining), plan.currency, language)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }, [theme, isRTL, isDark, language, t]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={planRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
          gap: 16,
        }}
        ListHeaderComponent={
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
              >
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
              </Pressable>
              <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>{t.plans.title}</Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(modals)/plan-form"); }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.plan + "20", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="plus" size={20} color={theme.plan} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="target"
            title={t.plans.noPlans}
            subtitle={t.plans.addFirstPlan}
            action={
              <Pressable
                onPress={() => router.push("/(modals)/plan-form")}
                style={{ backgroundColor: theme.plan, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.plans.add}</Text>
              </Pressable>
            }
          />
        }
      />
    </View>
  );
}
