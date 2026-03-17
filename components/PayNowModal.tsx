import React, { useState } from "react";
import type { Theme } from "@/theme/colors";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { formatDate, todayISOString } from "@/utils/date";
import * as Haptics from "expo-haptics";

interface PayNowModalProps {
  commitmentId: string;
  onClose: () => void;
}

export default function PayNowModal({ commitmentId, onClose }: PayNowModalProps) {
  const { theme, language, t, isRTL, showToast, settings } = useApp();
  const { getCommitment, payCommitment } = useCommitments();
  const { addTransaction } = useTransactions();
  const { getAccount, updateBalance } = useAccounts();
  const { getCategory } = useCategories();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const commitment = getCommitment(commitmentId);
  const account = commitment ? getAccount(commitment.account_id) : undefined;
  const category = commitment ? getCategory(commitment.category_id) : undefined;

  if (!commitment || !account) return null;

  const hasInsufficientBalance = account.balance < commitment.amount;
  const isOverdue = commitment.status === "overdue";
  const isDueToday = commitment.status === "due_today";

  const statusColors = {
    upcoming: theme.primary,
    due_today: "#F59E0B",
    overdue: "#EF4444",
    paid: theme.income,
  };
  const accentColor = statusColors[commitment.status] || theme.primary;

  const handleConfirm = async () => {
    if (hasInsufficientBalance) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const remainingDays = new Date(
        new Date().getFullYear(), new Date().getMonth() + 1, 0
      ).getDate() - new Date().getDate() + 1;
      const smartLimit = account.balance > 0 ? account.balance / remainingDays : 0;
      const dailyLimit = settings.daily_limit_mode === "manual" && settings.manual_daily_limit > 0
        ? settings.manual_daily_limit
        : smartLimit;
      addTransaction(
        {
          account_id: commitment.account_id,
          category_id: commitment.category_id,
          type: "expense",
          amount: commitment.amount,
          currency: account.currency,
          date: todayISOString(),
          note: note.trim() || getDisplayName(commitment, language),
          linked_commitment_id: commitment.id,
        },
        { enabled: settings.notification_enabled, dailyLimit }
      );

      updateBalance(commitment.account_id, -commitment.amount);
      payCommitment(commitment.id);
      setPaid(true);

      setTimeout(() => {
        onClose();
      }, 900);
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.card, alignItems: "center", gap: 12, paddingVertical: 32 }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.incomeBackground, alignItems: "center", justifyContent: "center" }}>
              <Feather name="check-circle" size={32} color={theme.income} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: theme.income }}>
              {t.commitments.paySuccess}
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center" }}>
              {language === "ar"
                ? `تم خصم ${formatCurrency(commitment.amount, account.currency, language)} من ${getDisplayName(account, language)}`
                : `${formatCurrency(commitment.amount, account.currency, language)} deducted from ${getDisplayName(account, language)}`}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modal, { backgroundColor: theme.card }]} onPress={() => {}}>

          {/* Header */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 19, fontWeight: "700", color: theme.text }}>
              {t.commitments.payConfirm}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Status badge */}
          {(isOverdue || isDueToday) && (
            <View style={{ backgroundColor: accentColor + "15", borderRadius: 10, padding: 10, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: accentColor + "30" }}>
              <Feather name={isOverdue ? "alert-triangle" : "clock"} size={14} color={accentColor} />
              <Text style={{ fontSize: 13, color: accentColor, fontWeight: "600", flex: 1 }}>
                {isOverdue
                  ? t.commitments.overdueWarning
                  : t.commitments.dueTodayWarning}
              </Text>
            </View>
          )}

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.cardSecondary }]}>
            <Row
              label={t.commitments.commitment}
              value={getDisplayName(commitment, language)}
              theme={theme} isRTL={isRTL}
            />
            <View style={{ height: 1, backgroundColor: theme.border }} />
            <Row
              label={t.common.amount}
              value={formatCurrency(commitment.amount, account.currency, language)}
              theme={theme} isRTL={isRTL}
              valueColor={accentColor}
              bold
            />
            <View style={{ height: 1, backgroundColor: theme.border }} />
            <Row
              label={t.transactions.account}
              value={getDisplayName(account, language)}
              theme={theme} isRTL={isRTL}
            />
            {category && (
              <Row
                label={t.categories.title}
                value={getDisplayName(category, language)}
                theme={theme} isRTL={isRTL}
              />
            )}
            <View style={{ height: 1, backgroundColor: theme.border }} />
            <Row
              label={t.commitments.dueDate}
              value={formatDate(commitment.due_date, language)}
              theme={theme} isRTL={isRTL}
            />
          </View>

          {/* Balance check warning */}
          {hasInsufficientBalance && (
            <View style={{ backgroundColor: "#EF444415", borderRadius: 10, padding: 12, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#EF444430" }}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: "#EF4444", fontWeight: "700" }}>
                  {t.validation.insufficientBalance}
                </Text>
                <Text style={{ fontSize: 12, color: "#EF4444", opacity: 0.8, marginTop: 2 }}>
                  {language === "ar"
                    ? `الرصيد المتاح: ${formatCurrency(account.balance, account.currency, language)}`
                    : `Available: ${formatCurrency(account.balance, account.currency, language)}`}
                </Text>
              </View>
            </View>
          )}

          {/* Note */}
          <TextInput
            placeholder={`${t.common.note} (${t.common.optional})`}
            value={note}
            onChangeText={setNote}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              padding: 12,
              color: theme.text,
              borderWidth: 1.5,
              borderColor: theme.inputBorder,
              textAlign: isRTL ? "right" : "left",
              fontSize: 14,
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
            placeholderTextColor={theme.textMuted}
          />

          {/* Actions */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? theme.border : theme.cardSecondary,
                borderWidth: 1,
                borderColor: theme.border,
              })}
            >
              <Text style={{ color: theme.text, fontWeight: "600", fontSize: 15 }}>{t.common.cancel}</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={loading || hasInsufficientBalance}
              style={({ pressed }) => ({
                flex: 1,
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: hasInsufficientBalance
                  ? theme.border
                  : pressed
                  ? accentColor + "CC"
                  : accentColor,
                opacity: loading ? 0.7 : 1,
              })}
            >
              {loading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Feather name="loader" size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    {t.common.processing}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                  <Feather name="check" size={16} color={hasInsufficientBalance ? theme.textMuted : "#fff"} />
                  <Text style={{ color: hasInsufficientBalance ? theme.textMuted : "#fff", fontWeight: "700", fontSize: 15 }}>
                    {t.commitments.payNow}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Description */}
          <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: "center" }}>
            {t.commitments.payDescription}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  label,
  value,
  theme,
  isRTL,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  theme: Theme;
  isRTL: boolean;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ fontSize: 13, color: theme.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: bold ? 16 : 14, fontWeight: bold ? "800" : "600", color: valueColor || theme.text }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 22,
    padding: 20,
    gap: 14,
  },
  infoCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
});
