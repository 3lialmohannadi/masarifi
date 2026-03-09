import React, { useState } from "react";
import { Modal, View, Text, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useApp } from "@/store/AppContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { todayISOString } from "@/utils/date";
import { AppButton } from "@/components/ui/AppButton";
import * as Haptics from "expo-haptics";

interface PayNowModalProps {
  commitmentId: string;
  onClose: () => void;
}

export default function PayNowModal({ commitmentId, onClose }: PayNowModalProps) {
  const { theme, language, t, isRTL } = useApp();
  const { getCommitment, payCommitment } = useCommitments();
  const { addTransaction } = useTransactions();
  const { getAccount, updateBalance } = useAccounts();
  const { getCategory, getCategoriesByType } = useCategories();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const commitment = getCommitment(commitmentId);
  const account = commitment ? getAccount(commitment.account_id) : undefined;
  const category = commitment ? getCategory(commitment.category_id) : undefined;

  if (!commitment || !account) return null;

  const handleConfirm = async () => {
    if (account.balance < commitment.amount) {
      Alert.alert(t.validation.insufficientBalance);
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      addTransaction({
        account_id: commitment.account_id,
        category_id: commitment.category_id,
        type: "expense",
        amount: commitment.amount,
        currency: account.currency,
        date: todayISOString(),
        note: note || getDisplayName(commitment, language),
        linked_commitment_id: commitment.id,
      });

      updateBalance(commitment.account_id, -commitment.amount);
      payCommitment(commitment.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <Text style={{ fontSize: 19, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
            {t.commitments.payConfirm}
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4, textAlign: isRTL ? "right" : "left" }}>
            {t.commitments.payDescription}
          </Text>

          <View style={[styles.infoCard, { backgroundColor: theme.cardSecondary }]}>
            <Row label={language === "ar" ? "الالتزام" : "Commitment"} value={getDisplayName(commitment, language)} theme={theme} isRTL={isRTL} />
            <Row label={t.common.amount} value={formatCurrency(commitment.amount, account.currency, language)} theme={theme} isRTL={isRTL} valueColor={theme.expense} />
            <Row label={t.transactions.account} value={getDisplayName(account, language)} theme={theme} isRTL={isRTL} />
            <Row label={t.commitments.dueDate} value={formatDate(commitment.due_date, language)} theme={theme} isRTL={isRTL} />
          </View>

          <TextInput
            placeholder={language === "ar" ? "ملاحظة (اختياري)" : "Note (optional)"}
            value={note}
            onChangeText={setNote}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              padding: 12,
              color: theme.text,
              borderWidth: 1,
              borderColor: theme.inputBorder,
              textAlign: isRTL ? "right" : "left",
            }}
            placeholderTextColor={theme.textMuted}
          />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? theme.cardSecondary : theme.cardSecondary,
                borderWidth: 1,
                borderColor: theme.border,
              })}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>{t.common.cancel}</Text>
            </Pressable>
            <AppButton
              title={t.commitments.payNow}
              onPress={handleConfirm}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({
  label,
  value,
  theme,
  isRTL,
  valueColor,
}: {
  label: string;
  value: string;
  theme: any;
  isRTL: boolean;
  valueColor?: string;
}) {
  return (
    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 13, color: theme.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: valueColor || theme.text }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
});
