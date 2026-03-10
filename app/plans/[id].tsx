import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { usePlans } from "@/store/PlansContext";
import { useTransactions } from "@/store/TransactionsContext";
import { TransactionItem } from "@/components/TransactionItem";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PlanCategory } from "@/types";

export default function PlanDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { plans, getPlanSpent, getPlanCategories, getPlanCategorySpent } = usePlans();
  const { transactions } = useTransactions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const plan = plans.find((p) => p.id === id);

  const planCategories = useMemo(
    () => (plan ? getPlanCategories(plan.id) : []),
    [plan, getPlanCategories]
  );

  const planTransactions = useMemo(() => {
    return [...transactions]
      .filter((tx) => tx.linked_plan_id === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, id]);

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.textMuted }}>{language === "ar" ? "الخطة غير موجودة" : "Plan not found"}</Text>
      </View>
    );
  }

  const spent = getPlanSpent(plan.id, transactions);
  const progress = plan.total_budget > 0 ? spent / plan.total_budget : 0;
  const remaining = plan.total_budget - spent;
  const color = plan.color || theme.plan;

  const totalCategoryBudget = planCategories.reduce((s, pc) => s + pc.budget_amount, 0);
  const unallocated = plan.total_budget - totalCategoryBudget;

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={planTransactions}
        keyExtractor={(tx) => tx.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: topPadding, paddingBottom: 4 }}>
              <Pressable onPress={() => router.back()}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                  {getDisplayName(plan, language)}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                  {t.plans.types[plan.plan_type]}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(`/(modals)/plan-form?id=${plan.id}`)}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="edit-2" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Plan Card */}
            <View style={{ backgroundColor: color, borderRadius: 20, padding: 20, gap: 16, marginBottom: 4 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={(plan.icon || "target") as any} size={24} color="#fff" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{t.plans.budget}</Text>
                  <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff" }}>
                    {formatCurrency(plan.total_budget, plan.currency, language)}
                  </Text>
                </View>
              </View>

              <ProgressBar progress={Math.min(progress, 1)} color="rgba(255,255,255,0.4)" height={8} backgroundColor="rgba(255,255,255,0.2)" />

              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.plans.spent}</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#FEF9C3" }}>{formatCurrency(spent, plan.currency, language)}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>{Math.round(progress * 100)}%</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.plans.remaining}</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: remaining < 0 ? "#FEF9C3" : "#DCFCE7" }}>{formatCurrency(remaining, plan.currency, language)}</Text>
                </View>
              </View>
            </View>

            {/* Dates */}
            <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 14, flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
              <View style={{ gap: 3 }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t.plans.startDate}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{formatDateShort(plan.start_date, language)}</Text>
              </View>
              <Feather name="arrow-right" size={18} color={theme.textMuted} style={{ alignSelf: "center" }} />
              <View style={{ gap: 3, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t.plans.endDate}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                  {plan.end_date ? formatDateShort(plan.end_date, language) : "∞"}
                </Text>
              </View>
            </View>

            {/* ── Categories Section ── */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
                {t.plans.categories}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/(modals)/plan-category-form?planId=${plan.id}`);
                }}
                style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4, backgroundColor: color + "15", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 }}
              >
                <Feather name="plus" size={14} color={color} />
                <Text style={{ fontSize: 13, fontWeight: "600", color }}>{t.plans.addCategory}</Text>
              </Pressable>
            </View>

            {planCategories.length === 0 ? (
              <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 20, alignItems: "center", gap: 8 }}>
                <Feather name="layers" size={24} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t.plans.noPlanCategories}</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {planCategories.map((pc) => {
                  const catSpent = getPlanCategorySpent(pc.id, transactions);
                  const catProgress = pc.budget_amount > 0 ? catSpent / pc.budget_amount : 0;
                  const catRemaining = pc.budget_amount - catSpent;
                  const isOverBudget = catSpent > pc.budget_amount;
                  return (
                    <Pressable
                      key={pc.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/(modals)/plan-category-form?planId=${plan.id}&categoryId=${pc.id}`);
                      }}
                      style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1.5, borderColor: pc.color + "30" }}
                    >
                      {/* Row: icon + name + budget */}
                      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: pc.color + "20", alignItems: "center", justifyContent: "center" }}>
                          <Feather name={(pc.icon || "tag") as any} size={18} color={pc.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                            {language === "ar" ? pc.name_ar || pc.name_en : pc.name_en || pc.name_ar}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                            {t.plans.budget}: {formatCurrency(pc.budget_amount, plan.currency, language)}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: isOverBudget ? "#EF4444" : pc.color }}>
                            {Math.round(catProgress * 100)}%
                          </Text>
                        </View>
                      </View>

                      {/* Progress bar */}
                      <ProgressBar progress={Math.min(catProgress, 1)} color={isOverBudget ? "#EF4444" : pc.color} height={5} />

                      {/* Spent / Remaining */}
                      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
                        <View>
                          <Text style={{ fontSize: 10, color: theme.textMuted }}>{t.plans.spent}</Text>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: isOverBudget ? "#EF4444" : theme.text }}>
                            {formatCurrency(catSpent, plan.currency, language)}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 10, color: theme.textMuted }}>{t.plans.remaining}</Text>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: catRemaining < 0 ? "#EF4444" : theme.textSecondary }}>
                            {formatCurrency(catRemaining, plan.currency, language)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}

                {/* Unallocated remainder */}
                {unallocated > 0 && (
                  <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 14, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.border, borderStyle: "dashed" as any }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.inputBorder, alignItems: "center", justifyContent: "center" }}>
                      <Feather name="more-horizontal" size={18} color={theme.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                        {language === "ar" ? "غير مخصص" : "Unallocated"}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textMuted }}>
                      {formatCurrency(unallocated, plan.currency, language)}
                    </Text>
                  </View>
                )}

                {/* Budget allocation bar */}
                {planCategories.length > 0 && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                      {language === "ar" ? "توزيع الميزانية" : "Budget Allocation"}
                    </Text>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.inputBorder, overflow: "hidden", flexDirection: "row" }}>
                      {planCategories.map((pc) => {
                        const pct = plan.total_budget > 0 ? pc.budget_amount / plan.total_budget : 0;
                        return (
                          <View key={pc.id} style={{ flex: pct, backgroundColor: pc.color, height: "100%" }} />
                        );
                      })}
                    </View>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
                      {planCategories.map((pc) => (
                        <View key={pc.id} style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pc.color }} />
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>
                            {language === "ar" ? pc.name_ar || pc.name_en : pc.name_en || pc.name_ar}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Transactions heading */}
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left", marginTop: 4 }}>
              {t.transactions.title}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionItem transaction={item} onPress={() => router.push(`/(modals)/add-transaction?id=${item.id}`)} />
        )}
        ListEmptyComponent={<EmptyState icon="repeat" title={t.transactions.noTransactions} subtitle={t.transactions.addFirst} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
