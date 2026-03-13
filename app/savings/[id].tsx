import React from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useSavings } from "@/store/SavingsContext";
import { useAccounts } from "@/store/AccountsContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort, getDaysRemaining } from "@/utils/date";
import type { SavingsMovementType } from "@/types";

function movementIcon(type: SavingsMovementType) {
  if (type === "deposit_internal" || type === "deposit_external") return "arrow-down-circle";
  return "arrow-up-circle";
}

function isDeposit(type: SavingsMovementType) {
  return type === "deposit_internal" || type === "deposit_external";
}

export default function SavingsDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, settings } = useApp();
  const primaryCurrency = settings.default_currency || "QAR";
  const { wallets, getWalletTransactions } = useSavings();
  const { accounts } = useAccounts();
  const { id } = useLocalSearchParams<{ id: string }>();

  const wallet = wallets.find((w) => w.id === id);
  const movements = id ? getWalletTransactions(id) : [];
  const sortedMovements = [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!wallet) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.textMuted }}>{t.savings.walletNotFound}</Text>
      </View>
    );
  }

  const hasGoal = wallet.type === "goal_savings" && !!wallet.target_amount && Number(wallet.target_amount) > 0;
  const progress = hasGoal
    ? Math.min(wallet.current_amount / Number(wallet.target_amount!), 1)
    : 0;

  const daysLeft = wallet.target_date ? getDaysRemaining(wallet.target_date) : null;
  const remaining = hasGoal ? Math.max(0, Number(wallet.target_amount!) - wallet.current_amount) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16, paddingBottom: 16 }}>
          <Pressable onPress={() => router.back()}>
            <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
            {getDisplayName(wallet, language)}
          </Text>
          <Pressable
            onPress={() => router.push(`/(modals)/saving-wallet-form?id=${wallet.id}`)}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="edit-2" size={17} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Main Card */}
        <View style={{ backgroundColor: wallet.color, borderRadius: 20, padding: 22, gap: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name={wallet.icon as any} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{t.savings.currentAmount}</Text>
              <Text style={{ fontSize: 30, fontWeight: "800", color: "#fff" }}>
                {formatCurrency(wallet.current_amount, primaryCurrency, language)}
              </Text>
            </View>
          </View>

          {hasGoal && (
            <>
              <ProgressBar progress={progress} color="rgba(255,255,255,0.4)" height={8} trackColor="rgba(255,255,255,0.2)" />
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{t.savings.goal}</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{formatCurrency(Number(wallet.target_amount!), primaryCurrency, language)}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{t.statistics.progress}</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>{Math.round(progress * 100)}%</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{t.savings.remaining}</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{formatCurrency(remaining, primaryCurrency, language)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Details Card */}
        <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, gap: 14, marginBottom: 20 }}>
          {wallet.description ? (
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.common.description}</Text>
              <Text style={{ fontSize: 15, color: theme.text, textAlign: isRTL ? "right" : "left" }}>{wallet.description}</Text>
            </View>
          ) : null}
          {wallet.target_date && (
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.savings.targetDate}</Text>
              <Text style={{ fontSize: 15, color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {formatDateShort(wallet.target_date, language)}
                {daysLeft !== null && daysLeft > 0 && (
                  <Text style={{ color: theme.primary }}> ({daysLeft} {t.savings.daysLeft})</Text>
                )}
              </Text>
            </View>
          )}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.common.type}</Text>
            <Text style={{ fontSize: 15, color: theme.text, textAlign: isRTL ? "right" : "left" }}>{t.savings.types[wallet.type]}</Text>
          </View>
        </View>

        {/* Movement History */}
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 10 }}>
          {t.savings.movements}
        </Text>
        {sortedMovements.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={t.savings.noMovements}
            subtitle={t.savings.addFirstMovement}
          />
        ) : (
          <View style={{ gap: 8 }}>
            {sortedMovements.map((mv) => {
              const deposit = isDeposit(mv.type);
              const account = mv.account_id ? accounts.find((a) => a.id === mv.account_id) : null;
              return (
                <View key={mv.id} style={{ backgroundColor: theme.card, borderRadius: 14, padding: 14, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: deposit ? theme.incomeBackground : theme.expenseBackground,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Feather name={movementIcon(mv.type)} size={18} color={deposit ? theme.income : theme.expense} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                      {deposit ? t.savings.deposit : t.savings.withdraw}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                      {formatDateShort(mv.date, language)}
                      {account ? ` · ${getDisplayName(account, language)}` : ""}
                      {mv.note ? ` · ${mv.note}` : ""}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: deposit ? theme.income : theme.expense }}>
                    {deposit ? "+" : "-"}{formatCurrency(mv.amount, primaryCurrency, language)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={{
        position: "absolute",
        bottom: insets.bottom + 20,
        left: 16,
        right: 16,
        flexDirection: isRTL ? "row-reverse" : "row",
        gap: 12,
      }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/(modals)/savings-movement?walletId=${wallet.id}&type=deposit`);
          }}
          style={{
            flex: 1,
            backgroundColor: theme.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: isRTL ? "row-reverse" : "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Feather name="plus-circle" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t.savings.deposit}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/(modals)/savings-movement?walletId=${wallet.id}&type=withdraw`);
          }}
          style={{
            flex: 1,
            backgroundColor: theme.card,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: isRTL ? "row-reverse" : "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Feather name="minus-circle" size={18} color={theme.expense} />
          <Text style={{ color: theme.expense, fontWeight: "700", fontSize: 15 }}>{t.savings.withdraw}</Text>
        </Pressable>
      </View>
    </View>
  );
}
