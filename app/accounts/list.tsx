import React from "react";
import { View, Text, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AccountsListScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { accounts } = useAccounts();

  const totalBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {t.accounts.title}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(modals)/account-form");
          }}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 10 }}
        ListHeaderComponent={
          accounts.length > 0 ? (
            <View style={{ backgroundColor: theme.primary, borderRadius: 18, padding: 20, marginBottom: 6, gap: 4 }}>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                {language === "ar" ? "إجمالي الأصول" : "Total Assets"}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>
                {formatCurrency(totalBalance, "USD", language)}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                {accounts.length} {t.accounts.accounts}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/accounts/${item.id}`)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.cardSecondary : theme.card,
              borderRadius: 16,
              padding: 16,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 12,
              borderLeftWidth: 4,
              borderLeftColor: item.color,
              opacity: item.is_active ? 1 : 0.5,
            })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: item.color + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                {getDisplayName(item, language)}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                {t.accounts.types[item.type]}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: item.balance >= 0 ? theme.text : theme.expense }}>
                {formatCurrency(item.balance, item.currency, language)}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>{item.currency}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="credit-card"
            title={t.accounts.noAccounts}
            action={
              <Pressable
                onPress={() => router.push("/(modals)/account-form")}
                style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.accounts.add}</Text>
              </Pressable>
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
