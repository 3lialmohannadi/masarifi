import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
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
  flat?: boolean;
}

export const TransactionItem = React.memo(function TransactionItem({ transaction, onPress, showDate = true, flat = false }: TransactionItemProps) {
  const { theme, language, isRTL, t, isDark } = useApp();
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
        backgroundColor: pressed ? theme.cardSecondary : flat ? "transparent" : theme.card,
        borderRadius: flat ? 0 : 16,
        marginBottom: flat ? 0 : 8,
        borderWidth: flat ? 0 : 1,
        borderColor: theme.border,
        ...(flat || isDark ? {} : Platform.OS === "web"
          ? { boxShadow: "0 2px 8px rgba(47,143,131,0.08)" }
          : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }),
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
        <CategoryIcon
          name={category?.icon || (isIncome ? "arrow-bottom-left" : "arrow-top-right")}
          size={20}
          color={catColor}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}
          numberOfLines={1}
        >
          {getDisplayName(category, language) || (isIncome ? t.transactions.income : t.transactions.expense)}
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
});
