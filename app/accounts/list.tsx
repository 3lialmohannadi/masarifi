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

  const activeAccounts = accounts.filter((a) => a.is_active);
  const archivedAccounts = accounts.filter((a) => !a.is_active);

  const currencyTotals = activeAccounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] || 0) + a.balance;
    return acc;
  }, {});
  const currencyEntries = Object.entries(currencyTotals);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
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
        data={activeAccounts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 10 }}
        ListHeaderComponent={
          activeAccounts.length > 0 ? (
            <View style={{ backgroundColor: theme.primary, borderRadius: 18, padding: 20, marginBottom: 6, gap: 8 }}>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                {t.accounts.totalAssets}
              </Text>
              {currencyEntries.length === 1 ? (
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>
                  {formatCurrency(currencyEntries[0][1], currencyEntries[0][0], language)}
                </Text>
              ) : (
                <View style={{ gap: 4 }}>
                  {currencyEntries.map(([currency, total]) => (
                    <Text key={currency} style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
                      {formatCurrency(total, currency, language)}
                    </Text>
                  ))}
                </View>
              )}
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                {activeAccounts.length} {t.accounts.accounts}
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
              borderLeftWidth: isRTL ? 0 : 4,
              borderRightWidth: isRTL ? 4 : 0,
              borderLeftColor: isRTL ? undefined : item.color,
              borderRightColor: isRTL ? item.color : undefined,
            })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: item.color + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {getDisplayName(item, language)}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                {t.accounts.types[item.type]}
              </Text>
            </View>
            <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: item.balance >= 0 ? theme.text : theme.expense }}>
                {formatCurrency(item.balance, item.currency, language)}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>{item.currency}</Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          archivedAccounts.length > 0 ? (
            <View style={{ marginTop: 16, gap: 8 }}>
              <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                {t.accounts.archived}
              </Text>
              {archivedAccounts.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/accounts/${item.id}`)}
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    opacity: 0.5,
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: item.color + "15", alignItems: "center", justifyContent: "center" }}>
                    <Feather name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
                      {getDisplayName(item, language)}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                      {t.accounts.archived}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null
        }
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
