import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useAccounts } from "@/store/AccountsContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";

export default function TransferDetailModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { transfers, deleteTransfer } = useTransactions();
  const { getAccount, updateBalance } = useAccounts();
  const { id } = useLocalSearchParams<{ id: string }>();

  const transfer = transfers.find((tf) => tf.id === id);

  if (!transfer) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.textMuted }}>{t.common.error}</Text>
      </View>
    );
  }

  const sourceAccount = getAccount(transfer.source_account_id);
  const destAccount = getAccount(transfer.destination_account_id);
  const sameCurrency = sourceAccount?.currency === destAccount?.currency;

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => setShowConfirmDelete(true);

  const confirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    updateBalance(transfer.source_account_id, transfer.source_amount);
    updateBalance(transfer.destination_account_id, -transfer.destination_amount);
    deleteTransfer(transfer.id);
    router.back();
  };

  const Row = ({
    label,
    value,
    valueColor,
    icon,
  }: {
    label: string;
    value: string;
    valueColor?: string;
    icon?: string;
  }) => (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        {icon && <Feather name={icon as any} size={15} color={theme.textMuted} />}
        <Text style={{ fontSize: 14, color: theme.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: "600", color: valueColor || theme.text }}>{value}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {t.transfer.detail}
        </Text>
        <Pressable onPress={handleDelete}>
          <Feather name="trash-2" size={20} color={theme.expense} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 0, paddingBottom: insets.bottom + 30 }}>
        {/* Hero Card */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            gap: 16,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: `${theme.transfer}18`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="shuffle" size={26} color={theme.transfer} />
          </View>

          {/* Amounts */}
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: theme.expense }}>
              -{formatCurrency(transfer.source_amount, sourceAccount?.currency || "QAR", language)}
            </Text>
            {!sameCurrency && (
              <Text style={{ fontSize: 18, fontWeight: "600", color: theme.income }}>
                +{formatCurrency(transfer.destination_amount, destAccount?.currency || "QAR", language)}
              </Text>
            )}
          </View>

          {/* From → To */}
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: theme.background,
              borderRadius: 14,
              padding: 12,
              width: "100%",
            }}
          >
            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              {sourceAccount && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: sourceAccount.color,
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.text,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {getDisplayName(sourceAccount || { name_ar: "?", name_en: "?" }, language)}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>{sourceAccount?.currency}</Text>
            </View>

            <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={20} color={theme.transfer} />

            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              {destAccount && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: destAccount.color,
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.text,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {getDisplayName(destAccount || { name_ar: "?", name_en: "?" }, language)}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textMuted }}>{destAccount?.currency}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            paddingHorizontal: 16,
          }}
        >
          <Row label={t.common.date} value={formatDateShort(transfer.date, language)} icon="calendar" />
          <Row
            label={t.transfer.sourceAmount}
            value={formatCurrency(transfer.source_amount, sourceAccount?.currency || "QAR", language)}
            valueColor={theme.expense}
            icon="arrow-up-right"
          />
          {!sameCurrency && (
            <>
              <Row
                label={t.transfer.destinationAmount}
                value={formatCurrency(transfer.destination_amount, destAccount?.currency || "QAR", language)}
                valueColor={theme.income}
                icon="arrow-down-left"
              />
              <Row
                label={`${t.transfer.rate} (1 ${sourceAccount?.currency} = ? ${destAccount?.currency})`}
                value={transfer.exchange_rate.toFixed(4)}
                icon="refresh-cw"
              />
            </>
          )}
          {transfer.note ? (
            <Row label={t.common.note} value={transfer.note} icon="message-square" />
          ) : null}
        </View>

        <View style={{ marginTop: 24 }}>
          <Pressable
            onPress={handleDelete}
            style={{
              backgroundColor: theme.expenseBackground,
              borderRadius: 14,
              padding: 16,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Feather name="trash-2" size={18} color={theme.expense} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.expense }}>
              {t.transfer.delete}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showConfirmDelete}
        title={t.common.areYouSure}
        message={t.transfer.deleteConfirm}
        confirmLabel={t.transfer.delete}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </View>
  );
}
