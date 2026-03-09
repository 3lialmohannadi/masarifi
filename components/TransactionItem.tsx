import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";
import type { Transaction } from "@/types";
import * as Haptics from "expo-haptics";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  showDate?: boolean;
}

export function TransactionItem({ transaction, onPress, showDate = true }: TransactionItemProps) {
  const { theme, language, isRTL } = useApp();
  const { getCategory } = useCategories();

  const category = getCategory(transaction.category_id);
  const isIncome = transaction.type === "income";
  const color = isIncome ? theme.income : theme.expense;
  const catColor = category?.color || color;

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

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
      })}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: `${catColor}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather
          name={(category?.icon || (isIncome ? "arrow-down-left" : "arrow-up-right")) as any}
          size={20}
          color={catColor}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}
          numberOfLines={1}
        >
          {getDisplayName(category, language) || (isIncome ? "Income" : "Expense")}
        </Text>
        {(showDate || transaction.note) && (
          <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
            {showDate ? formatDateShort(transaction.date, language) : ""}
            {showDate && transaction.note ? " · " : ""}
            {transaction.note || ""}
          </Text>
        )}
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color }}>
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount, transaction.currency, language)}
        </Text>
      </View>
    </Pressable>
  );
}
