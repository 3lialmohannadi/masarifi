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
import { useCategories } from "@/store/CategoriesContext";
import { TransactionItem } from "@/components/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";

type Filter = "all" | "income" | "expense";

function groupByDate(transactions: any[]) {
  const groups: { date: string; items: any[] }[] = [];
  const map: Record<string, number> = {};
  for (const tx of transactions) {
    const d = tx.date.slice(0, 10);
    if (map[d] === undefined) {
      map[d] = groups.length;
      groups.push({ date: d, items: [] });
    }
    groups[map[d]].items.push(tx);
  }
  return groups;
}

export default function TransactionsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, isRTL } = useApp();
  const { transactions } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const { getCategory } = useCategories();

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (selectedAccountId) result = result.filter((tx) => tx.account_id === selectedAccountId);
    if (filter !== "all") result = result.filter((tx) => tx.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((tx) => {
        const cat = getCategory(tx.category_id);
        const catName = cat ? getDisplayName(cat, language).toLowerCase() : "";
        return catName.includes(q) || (tx.note || "").toLowerCase().includes(q);
      });
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, search, selectedAccountId, language]);

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatGroupDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === today.toISOString().slice(0, 10)) return language === "ar" ? "اليوم" : "Today";
    if (dateStr === yesterday.toISOString().slice(0, 10)) return language === "ar" ? "أمس" : "Yesterday";
    const monthNames = language === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN;
    return `${d.getDate()} ${monthNames[d.getMonth()]}`;
  };

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const FILTERS: { key: Filter; label: string; color?: string }[] = [
    { key: "all", label: t.transactions.filterAll },
    { key: "income", label: t.transactions.filterIncome, color: theme.income },
    { key: "expense", label: t.transactions.filterExpense, color: theme.expense },
  ];

  type ListItem = { type: "header"; date: string } | { type: "tx"; tx: any };
  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    for (const group of groups) {
      items.push({ type: "header", date: group.date });
      for (const tx of group.items) {
        items.push({ type: "tx", tx });
      }
    }
    return items;
  }, [groups]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: theme.background, gap: 12 }}>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>{t.transactions.title}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(modals)/transfer-form"); }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
            >
              <Feather name="shuffle" size={16} color={theme.transfer} />
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(modals)/add-transaction"); }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="plus" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 14, paddingHorizontal: 14, gap: 10, borderWidth: 1, borderColor: theme.border }}>
          <Feather name="search" size={15} color={theme.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.transactions.searchPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, paddingVertical: 12, color: theme.text, fontSize: 14, textAlign: isRTL ? "right" : "left" }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter pills */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            const activeColor = f.color || theme.primary;
            return (
              <Pressable
                key={f.key}
                onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: isActive ? activeColor + "20" : theme.card, borderWidth: 1, borderColor: isActive ? activeColor : theme.border }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? activeColor : theme.textSecondary }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.type === "header" ? `h-${item.date}` : `tx-${item.tx.id}`}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary }}>
                  {formatGroupDate(item.date)}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              </View>
            );
          }
          return (
            <View style={{ paddingHorizontal: 16 }}>
              <TransactionItem
                transaction={item.tx}
                showDate={false}
                onPress={() => router.push(`/(modals)/add-transaction?id=${item.tx.id}`)}
              />
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 110) }}
        ListEmptyComponent={
          <EmptyState icon="repeat" title={t.transactions.noTransactions} subtitle={t.transactions.addFirst} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
