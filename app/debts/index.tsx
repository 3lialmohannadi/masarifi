import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Platform, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useDebts } from "@/store/DebtsContext";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtSummaryCards } from "@/components/debts/DebtSummaryCards";
import { DebtStatistics } from "@/components/debts/DebtStatistics";
import { EmptyState } from "@/components/ui/EmptyState";
import { DebtsSkeleton } from "@/components/ui/Skeleton";
import type { DebtCategory, DebtStatus } from "@/types";

type StatusFilter = "all" | DebtStatus;
type CategoryFilter = "all" | DebtCategory;

export default function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, settings } = useApp();
  const appCurrency = settings.default_currency;
  const { debts, totalOriginal, totalPaid, totalRemaining, activeDebts, isLoaded } = useDebts();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [pendingStatus, setPendingStatus] = useState<StatusFilter>("all");
  const [pendingCategory, setPendingCategory] = useState<CategoryFilter>("all");

  const filtered = useMemo(() => {
    let result = debts;
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);
    if (categoryFilter !== "all") result = result.filter((d) => d.category === categoryFilter);
    return result;
  }, [debts, statusFilter, categoryFilter]);

  const isFiltered = statusFilter !== "all" || categoryFilter !== "all";

  const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
    { key: "all",          label: t.debts.filterAll },
    { key: "active",       label: t.debts.filterActive },
    { key: "partially_paid",label: t.debts.filterPartiallyPaid },
    { key: "overdue",      label: t.debts.filterOverdue },
    { key: "completed",    label: t.debts.filterCompleted },
    { key: "cancelled",    label: t.debts.filterCancelled },
  ];

  const CATEGORY_OPTIONS: { key: CategoryFilter; label: string }[] = [
    { key: "all",      label: t.debts.filterAll },
    { key: "bank",     label: t.debts.filterBank },
    { key: "personal", label: t.debts.filterPersonal },
    { key: "company",  label: t.debts.filterCompany },
  ];

  function openFilters() {
    setPendingStatus(statusFilter);
    setPendingCategory(categoryFilter);
    setShowFilters(true);
    Haptics.selectionAsync();
  }

  function applyFilters() {
    setStatusFilter(pendingStatus);
    setCategoryFilter(pendingCategory);
    setShowFilters(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function clearFilters() {
    setPendingStatus("all");
    setPendingCategory("all");
    setStatusFilter("all");
    setCategoryFilter("all");
    setShowFilters(false);
    Haptics.selectionAsync();
  }

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 12, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }} />
          <View style={{ flex: 1, height: 24, borderRadius: 8, backgroundColor: theme.card }} />
        </View>
        <DebtsSkeleton />
      </View>
    );
  }

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
          onPress={openFilters}
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 18,
            backgroundColor: isFiltered ? theme.error + "18" : theme.card,
            borderWidth: 1,
            borderColor: isFiltered ? theme.error : theme.border,
          }}
        >
          <Feather name="sliders" size={14} color={isFiltered ? theme.error : theme.textSecondary} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: isFiltered ? theme.error : theme.textSecondary }}>
            {t.debts.filters}
          </Text>
          {isFiltered && (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.error }} />
          )}
        </Pressable>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.push("/(modals)/debt-form" as any); }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.error + "18", alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="plus" size={18} color={theme.error} />
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

      {isFiltered && (
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
          <Feather name="filter" size={13} color={theme.textMuted} />
          <Text style={{ fontSize: 12, color: theme.textMuted, flex: 1 }}>
            {filtered.length} {filtered.length === 1 ? t.debts.title.slice(0, -1) : t.debts.title}
          </Text>
          <Pressable onPress={clearFilters} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12, color: theme.error, fontWeight: "600" }}>{t.debts.clearFilters}</Text>
            <Feather name="x" size={12} color={theme.error} />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 12 }}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: 12 }}
        renderItem={({ item }) => (
          <DebtCard
            debt={item}
            onPress={() => { Haptics.selectionAsync(); router.push(`/debts/${item.id}` as any); }}
          />
        )}
        ListFooterComponent={
          debts.length > 0 ? (
            <View style={{ marginTop: 4 }}>
              <DebtStatistics
                debts={debts}
                totalOriginal={totalOriginal}
                totalPaid={totalPaid}
                totalRemaining={totalRemaining}
                currency={appCurrency || "QAR"}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="credit-card"
            title={t.debts.noDebts}
            subtitle={isFiltered ? t.debts.clearFilters : t.debts.addFirst}
            action={
              !isFiltered ? (
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.push("/(modals)/debt-form" as any); }}
                  style={{ marginTop: 4, backgroundColor: theme.error, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 11 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{t.debts.add}</Text>
                </Pressable>
              ) : undefined
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
          backgroundColor: theme.error,
          borderRadius: 28,
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 8,
          opacity: pressed ? 0.85 : 1,
          shadowColor: theme.error,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
        })}
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{t.debts.add}</Text>
      </Pressable>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setShowFilters(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              gap: 20,
            }}
            onPress={() => {}}
          >
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>{t.debts.filters}</Text>
              <Pressable onPress={() => setShowFilters(false)} hitSlop={8}>
                <Feather name="x" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                {t.debts.filterStatus}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = pendingStatus === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => { Haptics.selectionAsync(); setPendingStatus(opt.key); }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: active ? theme.error : theme.card,
                        borderWidth: 1,
                        borderColor: active ? theme.error : theme.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#fff" : theme.textSecondary }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                {t.debts.filterCategory}
              </Text>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, flexWrap: "wrap" }}>
                {CATEGORY_OPTIONS.map((opt) => {
                  const active = pendingCategory === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => { Haptics.selectionAsync(); setPendingCategory(opt.key); }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: active ? theme.error : theme.card,
                        borderWidth: 1,
                        borderColor: active ? theme.error : theme.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#fff" : theme.textSecondary }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              <Pressable
                onPress={clearFilters}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textSecondary }}>{t.debts.clearFilters}</Text>
              </Pressable>
              <Pressable
                onPress={applyFilters}
                style={{
                  flex: 2,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: theme.error,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{t.debts.applyFilters}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
