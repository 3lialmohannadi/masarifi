import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useDebts } from "@/store/DebtsContext";
import { formatCurrency } from "@/utils/currency";
import { DatePickerModal } from "@/components/DatePickerModal";

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DebtPaymentModal() {
  const { debtId } = useLocalSearchParams<{ debtId: string }>();
  const insets = useSafeAreaInsets();
  const { theme, language, isRTL, t, showToast } = useApp();
  const { debts, addPayment } = useDebts();

  const debt = debts.find((d) => d.id === debtId);
  const currency = debt?.currency || "QAR";

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISO(new Date()));
  const [note, setNote] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const amountNum = parseFloat(amount);

  function handleSave() {
    if (!debt) return;
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError(t.validation.amountRequired);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    addPayment({
      debt_id: debt.id,
      amount: amountNum,
      date: new Date(date).toISOString(),
      note: note.trim(),
    });
    showToast(t.debts.paySuccess, "success");
    router.back();
  }

  if (!debt) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.textMuted }}>{t.debts.debtNotFound}</Text>
      </View>
    );
  }

  const maxSuggestion = Math.max(0, debt.remaining_amount);
  const installmentSuggestion = debt.is_installment_based && debt.monthly_installment > 0
    ? debt.monthly_installment
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16, paddingBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="x" size={18} color={theme.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
            {t.debts.payNow}
          </Text>
        </View>

        <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 20, gap: 4 }}>
          <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>{debt.entity_name}</Text>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.debts.remainingAmount}:</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#EF4444" }}>
              {formatCurrency(debt.remaining_amount, currency, language)}
            </Text>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
              {t.debts.payAmount} <Text style={{ color: "#EF4444" }}>*</Text>
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: error ? "#EF4444" : theme.border, paddingHorizontal: 14 }}>
              <Feather name="dollar-sign" size={16} color={theme.textMuted} />
              <TextInput
                value={amount}
                onChangeText={(v) => { setAmount(v); setError(""); }}
                placeholder="0.000"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                style={{ flex: 1, paddingVertical: 13, color: theme.text, fontSize: 16, fontWeight: "600", textAlign: isRTL ? "right" : "left", ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) }}
              />
              <Text style={{ fontSize: 13, color: theme.textMuted }}>{currency}</Text>
            </View>
            {error ? <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{error}</Text> : null}
          </View>

          {(installmentSuggestion || maxSuggestion > 0) && (
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, flexWrap: "wrap" }}>
              {installmentSuggestion && (
                <Pressable
                  onPress={() => setAmount(String(installmentSuggestion))}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.primaryLight, borderWidth: 1, borderColor: theme.primary }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}>
                    {t.debts.monthlyInstallment}: {formatCurrency(installmentSuggestion, currency, language)}
                  </Text>
                </Pressable>
              )}
              {maxSuggestion > 0 && (
                <Pressable
                  onPress={() => setAmount(String(maxSuggestion))}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#05996910", borderWidth: 1, borderColor: "#059669" }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#059669" }}>
                    {t.debts.settlement}: {formatCurrency(maxSuggestion, currency, language)}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
              {t.debts.payDate}
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14, paddingVertical: 13 }}
            >
              <Feather name="calendar" size={16} color={theme.textMuted} />
              <Text style={{ flex: 1, color: theme.text, fontSize: 14, textAlign: isRTL ? "right" : "left" }}>{date}</Text>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
              {t.debts.payNote} <Text style={{ color: theme.textMuted, fontWeight: "400" }}>({t.common.optional})</Text>
            </Text>
            <View style={{ backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14 }}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t.debts.notesPlaceholder}
                placeholderTextColor={theme.textMuted}
                style={{ paddingVertical: 13, color: theme.text, fontSize: 14, textAlign: isRTL ? "right" : "left", ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) }}
              />
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({
            marginTop: 28,
            backgroundColor: "#EF4444",
            borderRadius: 16,
            paddingVertical: 15,
            alignItems: "center",
            opacity: saving || pressed ? 0.75 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{t.debts.payNow}</Text>
        </Pressable>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onConfirm={(d) => { setDate(d); setShowDatePicker(false); }}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  );
}
