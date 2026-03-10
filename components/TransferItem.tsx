import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";
import type { Transfer } from "@/types";
import * as Haptics from "expo-haptics";

interface TransferItemProps {
  transfer: Transfer;
  perspective?: "source" | "destination" | "both";
  onPress?: () => void;
  showDate?: boolean;
}

export function TransferItem({
  transfer,
  perspective = "both",
  onPress,
  showDate = true,
}: TransferItemProps) {
  const { theme, language, isRTL, t, isDark } = useApp();
  const { getAccount } = useAccounts();

  const sourceAccount = getAccount(transfer.source_account_id);
  const destAccount = getAccount(transfer.destination_account_id);

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  const sameCurrency =
    sourceAccount?.currency === destAccount?.currency;

  const isOutgoing = perspective === "source";
  const isIncoming = perspective === "destination";

  const amountDisplay = isOutgoing
    ? formatCurrency(transfer.source_amount, sourceAccount?.currency || "QAR", language)
    : isIncoming
    ? formatCurrency(transfer.destination_amount, destAccount?.currency || "QAR", language)
    : formatCurrency(transfer.source_amount, sourceAccount?.currency || "QAR", language);

  const amountColor = isIncoming ? theme.income : isOutgoing ? theme.expense : theme.transfer;
  const amountPrefix = isIncoming ? "+" : isOutgoing ? "-" : "";

  const labelTop =
    isOutgoing
      ? `${t.transfer.transferTo} ${getDisplayName(destAccount || { name_ar: "?", name_en: "?" }, language)}`
      : isIncoming
      ? `${t.transfer.transferFrom} ${getDisplayName(sourceAccount || { name_ar: "?", name_en: "?" }, language)}`
      : `${getDisplayName(sourceAccount || { name_ar: "?", name_en: "?" }, language)} → ${getDisplayName(destAccount || { name_ar: "?", name_en: "?" }, language)}`;

  const subLabel = [
    showDate ? formatDateShort(transfer.date, language) : "",
    transfer.note ? transfer.note : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 13,
        paddingHorizontal: 16,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.border,
        ...(isDark ? {} : Platform.OS === "web"
          ? { boxShadow: "0 2px 8px rgba(47,143,131,0.08)" }
          : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }),
      })}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: `${theme.transfer}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="shuffle" size={20} color={theme.transfer} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: theme.text,
            textAlign: isRTL ? "right" : "left",
          }}
          numberOfLines={1}
        >
          {labelTop}
        </Text>
        {(subLabel || (!sameCurrency && perspective !== "both")) && (
          <Text
            style={{
              fontSize: 12,
              color: theme.textMuted,
              textAlign: isRTL ? "right" : "left",
            }}
            numberOfLines={1}
          >
            {subLabel}
            {!sameCurrency && perspective === "source" && sourceAccount && destAccount
              ? `${subLabel ? " · " : ""}1 ${sourceAccount.currency} = ${transfer.exchange_rate} ${destAccount.currency}`
              : ""}
          </Text>
        )}
      </View>

      <View style={{ alignItems: isRTL ? "flex-start" : "flex-end", gap: 2 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: amountColor }}>
          {amountPrefix}
          {amountDisplay}
        </Text>
        {!sameCurrency && perspective === "both" && (
          <Text style={{ fontSize: 11, color: theme.textMuted }}>
            → {formatCurrency(transfer.destination_amount, destAccount?.currency || "QAR", language)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
