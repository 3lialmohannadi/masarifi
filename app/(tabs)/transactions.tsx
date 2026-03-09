import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { TransactionItem } from "@/components/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDisplayName } from "@/utils/display";

type Filter = "all" | "income" | "expense";

export default function TransactionsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, isRTL } = useApp();
  const { transactions } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const { getCategory } = useCategories();

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (selectedAccountId) {
      result = result.filter((tx) => tx.account_id === selectedAccountId);
    }
    if (filter !== "all") result = result.filter((tx) => tx.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((tx) => {
        const cat = getCategory(tx.category_id);
        const catName = cat ? getDisplayName(cat, language).toLowerCase() : "";
        return catName.includes(q) || (tx.note || "").toLowerCase().includes(q);
      });
    }
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filter, search, selectedAccountId, language]);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingTop: topPadding, paddingHorizontal: 16, paddingBottom: 8, gap: 14 }}>
        {/* Header */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>
            {t.transactions.title}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(modals)/transfer-form");
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: theme.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="shuffle" size={17} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/(modals)/add-transaction");
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
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            backgroundColor: theme.card,
            borderRadius: 12,
            paddingHorizontal: 12,
            gap: 8,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Feather name="search" size={16} color={theme.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.transactions.searchPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, paddingVertical: 10, color: theme.text, fontSize: 15 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
          {(["all", "income", "expense"] as Filter[]).map((f) => {
            const labels = {
              all: t.transactions.filterAll,
              income: t.transactions.filterIncome,
              expense: t.transactions.filterExpense,
            };
            const isActive = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? theme.primary : theme.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isActive ? "#fff" : theme.textSecondary,
                  }}
                >
                  {labels[f]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={() => router.push(`/(modals)/add-transaction?id=${item.id}`)}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
        }}
        ListEmptyComponent={
          <EmptyState
            icon="repeat"
            title={t.transactions.noTransactions}
            subtitle={t.transactions.addFirst}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
