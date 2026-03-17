import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation } from "react-native-reanimated";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
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
import { TransactionSkeleton } from "@/components/ui/Skeleton";
import { getDisplayName } from "@/utils/display";
import { todayISOString, formatDateShort } from "@/utils/date";
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

export default function TransactionsTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, isRTL } = useApp();
  const { transactions, transfers, isLoaded } = useTransactions();
  const { getCategory } = useCategories();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(search, 250);

  const scaleAll = useSharedValue(1);
  const scaleIncome = useSharedValue(1);
  const scaleExpense = useSharedValue(1);
  const scaleTransfer = useSharedValue(1);

  const activeAll = useSharedValue(1);
  const activeIncome = useSharedValue(0);
  const activeExpense = useSharedValue(0);
  const activeTransfer = useSharedValue(0);

  useEffect(() => {
    activeAll.value = withSpring(filter === "all" ? 1 : 0, { damping: 18, stiffness: 280 });
    activeIncome.value = withSpring(filter === "income" ? 1 : 0, { damping: 18, stiffness: 280 });
    activeExpense.value = withSpring(filter === "expense" ? 1 : 0, { damping: 18, stiffness: 280 });
    activeTransfer.value = withSpring(filter === "transfer" ? 1 : 0, { damping: 18, stiffness: 280 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const allStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeAll.value, [0, 1], [1, 1.03], Extrapolation.CLAMP) * scaleAll.value }],
  }));
  const incomeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeIncome.value, [0, 1], [1, 1.03], Extrapolation.CLAMP) * scaleIncome.value }],
  }));
  const expenseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeExpense.value, [0, 1], [1, 1.03], Extrapolation.CLAMP) * scaleExpense.value }],
  }));
  const transferStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeTransfer.value, [0, 1], [1, 1.03], Extrapolation.CLAMP) * scaleTransfer.value }],
  }));

  const filterCounts = useMemo(() => {
    const counts: Record<Filter, number> = { all: 0, income: 0, expense: 0, transfer: 0 };
    for (const tx of transactions) {
      if (selectedAccountId && tx.account_id !== selectedAccountId) continue;
      counts.all++;
      if (tx.type === "income") counts.income++;
      else if (tx.type === "expense") counts.expense++;
    }
    for (const tf of transfers) {
      const isSource = tf.source_account_id === selectedAccountId;
      const isDest = tf.destination_account_id === selectedAccountId;
      if (selectedAccountId && !isSource && !isDest) continue;
      counts.transfer++;
      counts.all++;
    }
    return counts;
  }, [transactions, transfers, selectedAccountId]);

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
  }, [transactions, transfers, filter, debouncedSearch, selectedAccountId, language]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const formatGroupDate = useCallback((dateStr: string): string => {
    const today = todayISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return t.transactions.today;
    if (dateStr === yesterday) return t.transactions.yesterday;
    return formatDateShort(dateStr, language);
  }, [t, language]);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const FILTERS = useMemo<{ key: Filter; label: string; color?: string }[]>(() => [
    { key: "all", label: t.transactions.filterAll },
    { key: "income", label: t.transactions.filterIncome, color: theme.income },
    { key: "expense", label: t.transactions.filterExpense, color: theme.expense },
    { key: "transfer", label: t.transactions.transfer, color: theme.transfer },
  ], [t, theme.income, theme.expense, theme.transfer]);

  const keyExtractor = useCallback((item: ListItem, i: number) => {
    if (item.type === "header") return `h-${item.date}`;
    if (item.type === "tx") return `tx-${item.tx.id}`;
    return `tf-${(item as any).transfer.id}`;
  }, []);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return (
        <View style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 8,
          gap: 10,
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: "700",
            color: theme.textSecondary,
            letterSpacing: 0.2,
          }}>
            {formatGroupDate(item.date)}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.border, opacity: 0.7 }} />
        </View>
      );
    }
    if (item.type === "transfer") {
      return (
        <View style={{ paddingHorizontal: 20 }}>
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
      <View style={{ paddingHorizontal: 20 }}>
        <TransactionItem
          transaction={item.tx}
          showDate={false}
          onPress={() => router.push(`/(modals)/add-transaction?id=${item.tx.id}`)}
        />
      </View>
    );
  }, [isRTL, theme.textSecondary, theme.border, formatGroupDate]);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{
        paddingTop: topPadding,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: theme.background,
        gap: 14,
      }}>
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
        <View style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          backgroundColor: theme.card,
          borderRadius: 14,
          paddingHorizontal: 14,
          gap: 10,
          borderWidth: 1.5,
          borderColor: searchFocused ? theme.primary : theme.border,
          ...(Platform.OS === "web" && searchFocused ? ({ boxShadow: `0 0 0 3px ${theme.primary}18` } as object) : {}),
        }}>
          <Feather name="search" size={16} color={searchFocused ? theme.primary : theme.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={t.transactions.searchPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={{
              flex: 1,
              paddingVertical: 12,
              color: theme.text,
              fontSize: 14,
              textAlign: isRTL ? "right" : "left",
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
              style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.textMuted + "20", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="x" size={12} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            const activeColor = f.color || theme.primary;
            const count = filterCounts[f.key];
            const animStyle = f.key === "all" ? allStyle : f.key === "income" ? incomeStyle : f.key === "expense" ? expenseStyle : transferStyle;
            const scaleVal = f.key === "all" ? scaleAll : f.key === "income" ? scaleIncome : f.key === "expense" ? scaleExpense : scaleTransfer;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  scaleVal.value = withSpring(0.93, { damping: 15, stiffness: 400 }, () => {
                    scaleVal.value = withSpring(1, { damping: 15, stiffness: 400 });
                  });
                  setFilter(f.key);
                }}
                style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
              >
                <Animated.View
                  style={[
                    {
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 5,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? activeColor + "20" : theme.card,
                      borderWidth: 1,
                      borderColor: isActive ? activeColor : theme.border,
                    },
                    animStyle,
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? activeColor : theme.textSecondary }}>
                    {f.label}
                  </Text>
                  {count > 0 && (
                    <View style={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: isActive ? activeColor : theme.textMuted + "25",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: isActive ? "#fff" : theme.textMuted }}>
                        {count > 99 ? "99+" : count}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!isLoaded ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <TransactionSkeleton />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110) }}
          ListEmptyComponent={
            <EmptyState
              icon="repeat"
              title={filter === "transfer" ? t.transfer.noTransfers : t.transactions.noTransactions}
              subtitle={filter === "transfer" ? t.transfer.addFirstTransfer : t.transactions.addFirst}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}
