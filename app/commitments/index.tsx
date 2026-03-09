import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { CommitmentItem } from "@/components/CommitmentItem";
import PayNowModal from "@/components/PayNowModal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CommitmentStatus } from "@/types";

type Filter = "all" | CommitmentStatus;

export default function CommitmentsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL } = useApp();
  const { commitments } = useCommitments();
  const [filter, setFilter] = useState<Filter>("all");
  const [payingId, setPayingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return commitments;
    return commitments.filter((c) => c.status === filter);
  }, [commitments, filter]);

  const overdueCount = commitments.filter((c) => c.status === "overdue").length;
  const dueTodayCount = commitments.filter((c) => c.status === "due_today").length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.transactions.filterAll },
    { key: "upcoming", label: t.commitments.status.upcoming },
    { key: "due_today", label: t.commitments.status.due_today },
    { key: "overdue", label: t.commitments.status.overdue },
    { key: "paid", label: t.commitments.status.paid },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Header */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: insets.top + 16, paddingBottom: 4 }}>
              <Pressable onPress={() => router.back()}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
              </Pressable>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.commitments.title}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(modals)/commitment-form");
                }}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.commitment, alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="plus" size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Alerts */}
            {(overdueCount > 0 || dueTodayCount > 0) && (
              <View style={{ gap: 8 }}>
                {overdueCount > 0 && (
                  <View style={{ backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#FECACA" }}>
                    <Feather name="alert-circle" size={18} color="#EF4444" />
                    <Text style={{ flex: 1, color: "#EF4444", fontWeight: "600" }}>
                      {overdueCount} {t.commitments.overdueAlert}
                    </Text>
                  </View>
                )}
                {dueTodayCount > 0 && (
                  <View style={{ backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#FDE68A" }}>
                    <Feather name="clock" size={18} color="#D97706" />
                    <Text style={{ flex: 1, color: "#D97706", fontWeight: "600" }}>
                      {dueTodayCount} {t.commitments.dueTodayAlert}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Filter Tabs */}
            <View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={FILTERS}
                keyExtractor={(f) => f.key}
                renderItem={({ item }) => {
                  const isActive = filter === item.key;
                  return (
                    <Pressable
                      onPress={() => { Haptics.selectionAsync(); setFilter(item.key); }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isActive ? theme.commitment : theme.card,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#fff" : theme.textSecondary }}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginTop: 8 }}>
            <CommitmentItem
              commitment={item}
              onPayNow={() => setPayingId(item.id)}
              onPress={() => router.push(`/(modals)/commitment-form?id=${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title={t.commitments.noCommitments}
            action={
              <Pressable
                onPress={() => router.push("/(modals)/commitment-form")}
                style={{ backgroundColor: theme.commitment, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.commitments.add}</Text>
              </Pressable>
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {payingId && (
        <PayNowModal commitmentId={payingId} onClose={() => setPayingId(null)} />
      )}
    </View>
  );
}
