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
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { theme, language } = useApp();
  const { getCategory } = useCategories();

  const category = getCategory(transaction.category_id);
  const isIncome = transaction.type === "income";
  const color = isIncome ? theme.income : theme.expense;
  const bg = isIncome ? theme.incomeBackground : theme.expenseBackground;

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        marginBottom: 6,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: category ? `${category.color}20` : bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather
          name={(category?.icon || "circle") as any}
          size={20}
          color={category?.color || color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
          numberOfLines={1}
        >
          {getDisplayName(category, language) || (isIncome ? "Income" : "Expense")}
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary }}>
          {formatDateShort(transaction.date, language)}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "700", color }}>
        {isIncome ? "+" : "-"}
        {formatCurrency(transaction.amount, transaction.currency, language)}
      </Text>
    </Pressable>
  );
}
