import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useApp } from "@/store/AppContext";
import { useCategories } from "@/store/CategoriesContext";
import { useSavings } from "@/store/SavingsContext";
import { useAccounts } from "@/store/AccountsContext";
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
  const { getWallet } = useSavings();
  const { getAccount } = useAccounts();

  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? theme.income : theme.expense;

  const isSavingsLinked = !!transaction.linked_saving_wallet_id;
  const isTransferLinked = !!transaction.linked_transfer_account_id;

  const linkedWallet = isSavingsLinked ? getWallet(transaction.linked_saving_wallet_id!) : undefined;
  const linkedAccount = isTransferLinked ? getAccount(transaction.linked_transfer_account_id!) : undefined;
  const category = !isSavingsLinked && !isTransferLinked ? getCategory(transaction.category_id) : undefined;

  let iconBg: string;
  let mainLabel: string;
  let iconNode: React.ReactNode;

  if (isSavingsLinked) {
    const walletColor = linkedWallet?.color || theme.primary;
    const walletName = linkedWallet ? getDisplayName(linkedWallet, language) : t.savings.wallet;
    iconBg = walletColor + "18";
    mainLabel = walletName;
    iconNode = (
      <MaterialCommunityIcons
        name={(linkedWallet?.icon as any) || "piggy-bank"}
        size={20}
        color={walletColor}
      />
    );
  } else if (isTransferLinked) {
    const accountColor = linkedAccount?.color || theme.primary;
    const accountName = linkedAccount ? getDisplayName(linkedAccount, language) : t.transactions.account;
    iconBg = accountColor + "18";
    mainLabel = accountName;
    iconNode = (
      <Feather
        name="repeat"
        size={20}
        color={accountColor}
      />
    );
  } else {
    const catColor = category?.color || amountColor;
    iconBg = `${catColor}18`;
    mainLabel = getDisplayName(category, language) || (isIncome ? t.transactions.income : t.transactions.expense);
    iconNode = (
      <CategoryIcon
        name={category?.icon || (isIncome ? "arrow-bottom-left" : "arrow-top-right")}
        size={20}
        color={catColor}
      />
    );
  }

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
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {iconNode}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}
          numberOfLines={1}
        >
          {mainLabel}
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
        <Text style={{ fontSize: 16, fontWeight: "700", color: amountColor }}>
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount, transaction.currency, language)}
        </Text>
      </View>
    </Pressable>
  );
});
