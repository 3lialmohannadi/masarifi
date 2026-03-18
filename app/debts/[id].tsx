import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useDebts } from "@/store/DebtsContext";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";
import { DebtStatusBadge } from "@/components/debts/DebtStatusBadge";

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme, language, isRTL, t, isDark, showToast } = useApp();
  const { debts, deleteDebt, updateDebt, getPaymentsForDebt, deletePayment } = useDebts();
  const debt = debts.find((d) => d.id === id);

  if (!debt) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.textMuted }}>{t.debts.debtNotFound}</Text>
      </View>
    );
  }

  const payments = getPaymentsForDebt(debt.id);
  const currency = debt.currency;
  const progress = debt.original_amount > 0
    ? Math.min(1, debt.paid_amount / debt.original_amount)
    : 0;
  const progressPct = Math.round(progress * 100);

  const progressColor =
    debt.status === "completed"      ? "#059669" :
    debt.status === "overdue"        ? "#EF4444" :
    debt.status === "partially_paid" ? "#D97706" :
    debt.status === "cancelled"      ? "#6B7280" :
    theme.primary;

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const cardShadow = Platform.OS === "web"
    ? {}
    : isDark ? {} : {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      };

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  function handleDelete() {
    setShowConfirmDelete(true);
  }

  function confirmDeleteDebt() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (debt) deleteDebt(debt.id);
    router.back();
    showToast(t.toast.deleted, "success");
  }

  function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text style={{ fontSize: 14, color: theme.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: "600", color: valueColor || theme.text, textAlign: isRTL ? "left" : "right", maxWidth: "60%" }}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: topPadding, paddingBottom: 8, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
            {debt.entity_name}
          </Text>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/(modals)/debt-form" as any, params: { id: debt?.id } }); }}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="edit-2" size={16} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EF444418", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </Pressable>
        </View>

        <View style={{ alignItems: "center", gap: 6, paddingVertical: 20, backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 16, ...cardShadow }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: debt.subcategory_color + "20", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
            <Feather name={debt.subcategory_icon as any} size={26} color={debt.subcategory_color} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }}>{debt.entity_name}</Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            {language === "ar" ? debt.subcategory_ar : debt.subcategory_en}
          </Text>
          <DebtStatusBadge status={debt.status} />

          <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 12, gap: 6 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>{t.debts.totalPaid}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: progressColor }}>{progressPct}%</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.cardSecondary }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: progressColor, width: `${progressPct}%` }} />
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: "#059669", fontWeight: "600" }}>
                {formatCurrency(debt.paid_amount, currency, language)}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {formatCurrency(debt.original_amount, currency, language)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, marginBottom: 16, ...cardShadow }}>
          <InfoRow label={t.debts.originalAmount} value={formatCurrency(debt.original_amount, currency, language)} />
          <InfoRow label={t.debts.paidAmount} value={formatCurrency(debt.paid_amount, currency, language)} valueColor="#059669" />
          <InfoRow
            label={t.debts.remainingAmount}
            value={formatCurrency(debt.remaining_amount, currency, language)}
            valueColor={debt.status === "overdue" ? "#EF4444" : theme.text}
          />
          {debt.is_installment_based && debt.monthly_installment > 0 && (
            <InfoRow label={t.debts.monthlyInstallment} value={formatCurrency(debt.monthly_installment, currency, language)} />
          )}
          {debt.is_installment_based && debt.total_installments > 0 && (
            <InfoRow label={t.debts.totalInstallments} value={`${debt.completed_installments} / ${debt.total_installments}`} />
          )}
          {debt.due_date ? (
            <InfoRow label={t.debts.dueDate} value={formatDateShort(debt.due_date, language)} />
          ) : null}
          {debt.start_date ? (
            <InfoRow label={t.debts.startDate} value={formatDateShort(debt.start_date, language)} />
          ) : null}
          {debt.end_date ? (
            <InfoRow label={t.debts.endDate} value={formatDateShort(debt.end_date, language)} />
          ) : null}
          {debt.notes ? (
            <InfoRow label={t.debts.notes} value={debt.notes} />
          ) : null}
        </View>

        {debt.status === "overdue" && (
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, backgroundColor: "#EF444410", borderRadius: 14, padding: 14, marginBottom: 16, alignItems: "center" }}>
            <Feather name="alert-triangle" size={16} color="#EF4444" />
            <Text style={{ flex: 1, fontSize: 13, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{t.debts.overdueWarning}</Text>
          </View>
        )}

        {debt.status !== "completed" && debt.status !== "cancelled" && (
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push({ pathname: "/(modals)/debt-payment" as any, params: { debtId: debt?.id } }); }}
            style={({ pressed }) => ({
              backgroundColor: "#EF4444",
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center",
              marginBottom: 12,
              opacity: pressed ? 0.85 : 1,
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "center",
              gap: 8,
            })}
          >
            <Feather name="dollar-sign" size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{t.debts.payNow}</Text>
          </Pressable>
        )}

        {debt.status !== "completed" && (
          <Pressable
            onPress={() => {
              if (debt.status === "cancelled") {
                const newStatus: import("@/types").DebtStatus = "active";
                updateDebt(debt.id, { status: newStatus });
                showToast(t.toast.saved, "success");
                router.back();
              } else {
                setShowConfirmCancel(true);
              }
            }}
            style={({ pressed }) => ({
              borderRadius: 16,
              paddingVertical: 13,
              alignItems: "center",
              marginBottom: 16,
              opacity: pressed ? 0.85 : 1,
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: debt.status === "cancelled" ? theme.primary : "#6B7280",
              backgroundColor: debt.status === "cancelled" ? theme.primaryLight : "#6B728012",
            })}
          >
            <Feather
              name={debt.status === "cancelled" ? "refresh-cw" : "x-circle"}
              size={16}
              color={debt.status === "cancelled" ? theme.primary : "#6B7280"}
            />
            <Text style={{ fontSize: 15, fontWeight: "700", color: debt.status === "cancelled" ? theme.primary : "#6B7280" }}>
              {debt.status === "cancelled" ? t.debts.reactivateDebt : t.debts.cancelDebt}
            </Text>
          </Pressable>
        )}

        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 12 }}>
            {t.debts.payHistory}
          </Text>

          {payments.length === 0 ? (
            <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 24, alignItems: "center", gap: 8 }}>
              <Feather name="clock" size={24} color={theme.textMuted} />
              <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: "center" }}>{t.debts.noPayHistory}</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: "hidden", ...cardShadow }}>
              {payments.map((p, i) => (
                <View
                  key={p.id}
                  style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < payments.length - 1 ? 1 : 0, borderBottomColor: theme.border }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "#05996918", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="check-circle" size={16} color="#059669" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#059669", textAlign: isRTL ? "right" : "left" }}>
                      {formatCurrency(p.amount, currency, language)}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                      {formatDateShort(p.date, language)}
                      {p.note ? `  ·  ${p.note}` : ""}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); deletePayment(p.id, debt.id); }}
                    hitSlop={8}
                  >
                    <Feather name="x" size={16} color={theme.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showConfirmDelete}
        title={t.debts.delete}
        message={t.debts.deleteConfirm}
        onConfirm={confirmDeleteDebt}
        onCancel={() => setShowConfirmDelete(false)}
      />

      <ConfirmDialog
        visible={showConfirmCancel}
        title={t.debts.cancelDebt}
        message={t.debts.cancelDebtConfirm}
        confirmLabel={t.debts.cancelDebt}
        icon="x-circle"
        confirmColor="#6B7280"
        onConfirm={() => {
          updateDebt(debt.id, { status: "cancelled" });
          showToast(t.toast.saved, "success");
          setShowConfirmCancel(false);
          router.back();
        }}
        onCancel={() => setShowConfirmCancel(false)}
      />
    </View>
  );
}
