import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { TransactionItem } from "@/components/TransactionItem";
import { TransferItem } from "@/components/TransferItem";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Transaction, Transfer } from "@/types";

type ListEntry =
  | { kind: "tx"; tx: Transaction; date: string }
  | { kind: "transfer"; transfer: Transfer; perspective: "source" | "destination"; date: string };

type ListItem =
  | { type: "header"; date: string }
  | { type: "tx"; tx: Transaction }
  | { type: "transfer"; transfer: Transfer; perspective: "source" | "destination" };

const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTH_NAMES_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AccountDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { accounts } = useAccounts();
  const { transactions, transfers } = useTransactions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const account = accounts.find((a) => a.id === id);

  const accountTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.account_id === id);
  }, [transactions, id]);

  const accountTransfers = useMemo(() => {
    return transfers.filter(
      (tf) => tf.source_account_id === id || tf.destination_account_id === id
    );
  }, [transfers, id]);

  const totalIncome = accountTransactions
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = accountTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);

  const formatGroupDate = (dateStr: string): string => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return t.transactions.today;
    if (dateStr === yesterday) return t.transactions.yesterday;
    const d = new Date(dateStr);
    const names = language === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN;
    return `${d.getDate()} ${names[d.getMonth()]}`;
  };

  const listData = useMemo<ListItem[]>(() => {
    const entries: ListEntry[] = [];

    for (const tx of accountTransactions) {
      entries.push({ kind: "tx", tx, date: tx.date.slice(0, 10) });
    }

    for (const tf of accountTransfers) {
      const perspective = tf.source_account_id === id ? "source" : "destination";
      entries.push({ kind: "transfer", transfer: tf, perspective, date: tf.date.slice(0, 10) });
    }

    entries.sort((a, b) => {
      const da = a.kind === "tx" ? a.tx.date : a.transfer.date;
      const db = b.kind === "tx" ? b.tx.date : b.transfer.date;
      return new Date(db).getTime() - new Date(da).getTime();
    });

    const items: ListItem[] = [];
    let currentDate = "";
    for (const entry of entries) {
      if (entry.date !== currentDate) {
        currentDate = entry.date;
        items.push({ type: "header", date: entry.date });
      }
      if (entry.kind === "tx") {
        items.push({ type: "tx", tx: entry.tx });
      } else {
        items.push({ type: "transfer", transfer: entry.transfer, perspective: entry.perspective });
      }
    }
    return items;
  }, [accountTransactions, accountTransfers, id]);

  if (!account) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.textMuted }}>{t.accounts.accountNotFound}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={listData}
        keyExtractor={(item, i) => {
          if (item.type === "header") return `h-${item.date}`;
          if (item.type === "tx") return `tx-${item.tx.id}`;
          return `tf-${item.transfer.id}`;
        }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16, paddingBottom: 4 }}>
              <Pressable onPress={() => router.back()}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                  {getDisplayName(account, language)}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                  {t.accounts.types[account.type]}
                  {!account.is_active && ` · ${t.accounts.archived}`}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(`/(modals)/account-form?id=${account.id}`)}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="edit-2" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Balance Card */}
            <View style={{ backgroundColor: account.color, borderRadius: 18, padding: 20, gap: 12 }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={account.icon as any} size={22} color="#fff" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{t.dashboard.totalBalance}</Text>
                  <Text style={{ fontSize: 30, fontWeight: "800", color: "#fff" }}>
                    {formatCurrency(account.balance, account.currency, language)}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.transactions.income}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#DCFCE7" }}>{formatCurrency(totalIncome, account.currency, language)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{t.transactions.expense}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#FEF9C3" }}>{formatCurrency(totalExpense, account.currency, language)}</Text>
                </View>
              </View>
            </View>

            {listData.length > 0 && (
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left", marginTop: 4 }}>
                {t.transactions.title}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", paddingTop: 16, paddingBottom: 8, gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary }}>
                  {formatGroupDate(item.date)}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              </View>
            );
          }
          if (item.type === "transfer") {
            return (
              <TransferItem
                transfer={item.transfer}
                perspective={item.perspective}
                showDate={false}
                onPress={() => router.push(`/(modals)/transfer-detail?id=${item.transfer.id}`)}
              />
            );
          }
          return (
            <TransactionItem
              transaction={item.tx}
              showDate={false}
              onPress={() => router.push(`/(modals)/add-transaction?id=${item.tx.id}`)}
            />
          );
        }}
        ListEmptyComponent={<EmptyState icon="repeat" title={t.transactions.noTransactions} />}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB — only for active accounts */}
      {account.is_active ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/(modals)/add-transaction?accountId=${account.id}`);
          }}
          style={{
            position: "absolute",
            bottom: insets.bottom + 24,
            right: 20,
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}
