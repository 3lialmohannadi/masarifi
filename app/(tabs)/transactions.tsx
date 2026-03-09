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
import { TransferItem } from "@/components/TransferItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDisplayName } from "@/utils/display";
import { useDebounce } from "@/hooks/useDebounce";
import type { Transaction, Transfer } from "@/types";

type Filter = "all" | "income" | "expense" | "transfer";

type CombinedEntry =
  | { kind: "tx"; tx: Transaction; date: string }
  | { kind: "transfer"; transfer: Transfer; date: string };

type ListItem =
  | { type: "header"; date: string }
  | { type: "tx"; tx: Transaction }
  | { type: "transfer"; transfer: Transfer; perspective: "source" | "destination" | "both" };

const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTH_NAMES_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function TransactionsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, isRTL } = useApp();
  const { transactions, transfers, isLoaded } = useTransactions();
  const { getCategory } = useCategories();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const combined = useMemo<CombinedEntry[]>(() => {
    const entries: CombinedEntry[] = [];

    for (const tx of transactions) {
      if (selectedAccountId && tx.account_id !== selectedAccountId) continue;
      if (filter === "income" && tx.type !== "income") continue;
      if (filter === "expense" && tx.type !== "expense") continue;
      if (filter === "transfer") continue;
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const cat = getCategory(tx.category_id);
        const catName = cat ? getDisplayName(cat, language).toLowerCase() : "";
        if (!catName.includes(q) && !(tx.note || "").toLowerCase().includes(q)) continue;
      }
      entries.push({ kind: "tx", tx, date: tx.date.slice(0, 10) });
    }

    if (filter !== "income" && filter !== "expense") {
      for (const tf of transfers) {
        const isSource = tf.source_account_id === selectedAccountId;
        const isDest = tf.destination_account_id === selectedAccountId;
        if (selectedAccountId && !isSource && !isDest) continue;
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase();
          if (!(tf.note || "").toLowerCase().includes(q)) continue;
        }
        entries.push({ kind: "transfer", transfer: tf, date: tf.date.slice(0, 10) });
      }
    }

    return entries.sort((a, b) => {
      const dateA = a.kind === "tx" ? a.tx.date : a.transfer.date;
      const dateB = b.kind === "tx" ? b.tx.date : b.transfer.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [transactions, transfers, filter, debouncedSearch, selectedAccountId, language]);

  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let currentDate = "";
    for (const entry of combined) {
      const date = entry.date;
      if (date !== currentDate) {
        currentDate = date;
        items.push({ type: "header", date });
      }
      if (entry.kind === "tx") {
        items.push({ type: "tx", tx: entry.tx });
      } else {
        const isSource = entry.transfer.source_account_id === selectedAccountId;
        const isDest = entry.transfer.destination_account_id === selectedAccountId;
        const perspective = selectedAccountId
          ? isSource ? "source" : isDest ? "destination" : "both"
          : "both";
        items.push({ type: "transfer", transfer: entry.transfer, perspective });
      }
    }
    return items;
  }, [combined, selectedAccountId]);

  const formatGroupDate = (dateStr: string): string => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return t.transactions.today;
    if (dateStr === yesterday) return t.transactions.yesterday;
    const d = new Date(dateStr);
    const names = language === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN;
    return `${d.getDate()} ${names[d.getMonth()]}`;
  };

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const FILTERS: { key: Filter; label: string; color?: string }[] = [
    { key: "all", label: t.transactions.filterAll },
    { key: "income", label: t.transactions.filterIncome, color: theme.income },
    { key: "expense", label: t.transactions.filterExpense, color: theme.expense },
    { key: "transfer", label: t.transactions.transfer, color: theme.transfer },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingTop: topPadding, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: theme.background, gap: 12 }}>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>{t.transactions.title}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              testID="btn-new-transfer"
              accessibilityLabel={t.transfer.title}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(modals)/transfer-form"); }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
            >
              <Feather name="shuffle" size={16} color={theme.transfer} />
            </Pressable>
            <Pressable
              testID="btn-add-transaction"
              accessibilityLabel={t.transactions.add}
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
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
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
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: isActive ? activeColor + "20" : theme.card, borderWidth: 1, borderColor: isActive ? activeColor : theme.border }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? activeColor : theme.textSecondary }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) => {
          if (item.type === "header") return `h-${item.date}`;
          if (item.type === "tx") return `tx-${item.tx.id}`;
          return `tf-${item.transfer.id}`;
        }}
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
          if (item.type === "transfer") {
            return (
              <View style={{ paddingHorizontal: 16 }}>
                <TransferItem
                  transfer={item.transfer}
                  perspective={item.perspective}
                  showDate={false}
                  onPress={() => router.push(`/(modals)/transfer-detail?id=${item.transfer.id}`)}
                />
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
          !isLoaded ? null : (
            <EmptyState
              icon="repeat"
              title={filter === "transfer" ? t.transfer.noTransfers : t.transactions.noTransactions}
              subtitle={filter !== "transfer" ? t.transactions.addFirst : undefined}
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
