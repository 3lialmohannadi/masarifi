import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useDebts } from "@/store/DebtsContext";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtSummaryCards } from "@/components/debts/DebtSummaryCards";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Debt, DebtCategory, DebtStatus } from "@/types";

type StatusFilter = "all" | DebtStatus;
type CategoryFilter = "all" | DebtCategory;

export default function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, settings } = useApp();
  const appCurrency = settings.default_currency;
  const { debts, totalOriginal, totalPaid, totalRemaining, activeDebts } = useDebts();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(() => {
    let result = debts;
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);
    if (categoryFilter !== "all") result = result.filter((d) => d.category === categoryFilter);
    return result;
  }, [debts, statusFilter, categoryFilter]);

  const overdueCount = debts.filter((d) => d.status === "overdue").length;
  const completedCount = debts.filter((d) => d.status === "completed").length;

  const STATUS_FILTERS: { key: StatusFilter; label: string; count?: number }[] = [
    { key: "all", label: t.debts.filterAll, count: debts.length },
    { key: "active", label: t.debts.filterActive },
    { key: "overdue", label: t.debts.filterOverdue, count: overdueCount || undefined },
    { key: "completed", label: t.debts.filterCompleted, count: completedCount || undefined },
  ];

  const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
    { key: "all",      label: t.common.all },
    { key: "bank",     label: t.debts.filterBank },
    { key: "personal", label: t.debts.filterPersonal },
    { key: "company",  label: t.debts.filterCompany },
  ];

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const renderHeader = () => (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: topPadding, paddingBottom: 4 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
        >
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {t.debts.title}
        </Text>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.push("/(modals)/debt-form" as any); }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EF444418", alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="plus" size={18} color="#EF4444" />
        </Pressable>
      </View>

      {debts.length > 0 && (
        <DebtSummaryCards
          totalOriginal={totalOriginal}
          totalPaid={totalPaid}
          totalRemaining={totalRemaining}
          activeCount={activeDebts.length}
          currency={appCurrency || "QAR"}
        />
      )}

      {debts.length > 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}>
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => { Haptics.selectionAsync(); setStatusFilter(f.key); }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: active ? theme.primary : theme.card,
                    borderWidth: 1,
                    borderColor: active ? theme.primary : theme.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#fff" : theme.textSecondary }}>
                    {f.label}
                  </Text>
                  {f.count !== undefined && f.count > 0 && (
                    <View style={{ backgroundColor: active ? "rgba(255,255,255,0.3)" : theme.primaryLight, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: active ? "#fff" : theme.primary }}>{f.count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}>
            {CATEGORY_FILTERS.map((f) => {
              const active = categoryFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => { Haptics.selectionAsync(); setCategoryFilter(f.key); }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: active ? "#EF444418" : theme.card,
                    borderWidth: 1,
                    borderColor: active ? "#EF4444" : theme.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#EF4444" : theme.textSecondary }}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: 12 }}
        renderItem={({ item }) => (
          <DebtCard
            debt={item}
            onPress={() => { Haptics.selectionAsync(); router.push(`/debts/${item.id}` as any); }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="credit-card"
            title={t.debts.noDebts}
            subtitle={t.debts.addFirst}
            action={
              <Pressable
                onPress={() => { Haptics.selectionAsync(); router.push("/(modals)/debt-form" as any); }}
                style={{ marginTop: 4, backgroundColor: "#EF4444", borderRadius: 24, paddingHorizontal: 24, paddingVertical: 11 }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{t.debts.add}</Text>
              </Pressable>
            }
          />
        }
      />

      <Pressable
        onPress={() => { Haptics.selectionAsync(); router.push("/(modals)/debt-form" as any); }}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: insets.bottom + 20,
          right: isRTL ? undefined : 20,
          left: isRTL ? 20 : undefined,
          backgroundColor: "#EF4444",
          borderRadius: 28,
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 8,
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#EF4444",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
        })}
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{t.debts.add}</Text>
      </Pressable>
    </View>
  );
}
