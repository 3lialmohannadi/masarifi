import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useDebts } from "@/store/DebtsContext";
import { DatePickerModal } from "@/components/DatePickerModal";
import { SuccessOverlay } from "@/components/ui/SuccessOverlay";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { dateToISO } from "@/utils/date";
import type { DebtCategory, DebtStatus } from "@/types";
import {
  CATEGORY_SUBCATEGORIES,
  CATEGORY_META,
  type SubcategoryDef,
} from "@/utils/debtSubcategories";

type RepaymentMode = "months" | "due_date";

export default function DebtFormModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { theme, language, isRTL, t, showToast, settings } = useApp();
  const appCurrency = settings.default_currency;
  const { debts, addDebt, updateDebt, deleteDebt } = useDebts();

  const existingDebt = id ? debts.find((d) => d.id === id) : undefined;
  const isEdit = !!existingDebt;

  const [category, setCategory] = useState<DebtCategory>(existingDebt?.category || "personal");
  const [subcategory, setSubcategory] = useState<string>(existingDebt?.subcategory || "personal_borrow");
  const [isCustomSub, setIsCustomSub] = useState(
    existingDebt ? !CATEGORY_SUBCATEGORIES[existingDebt.category].some((s) => s.key === existingDebt.subcategory) : false
  );
  const [customSubNameAr, setCustomSubNameAr] = useState(isCustomSub && existingDebt ? existingDebt.subcategory_ar : "");
  const [customSubNameEn, setCustomSubNameEn] = useState(isCustomSub && existingDebt ? existingDebt.subcategory_en : "");
  const [customSubIcon, setCustomSubIcon] = useState(isCustomSub && existingDebt ? existingDebt.subcategory_icon : "credit-card");
  const [customSubColor, setCustomSubColor] = useState(isCustomSub && existingDebt ? existingDebt.subcategory_color : "#6B7280");

  const [entityName, setEntityName] = useState(existingDebt?.entity_name || "");
  const [originalAmount, setOriginalAmount] = useState(existingDebt ? String(existingDebt.original_amount) : "");
  const [remainingAmount, setRemainingAmount] = useState(existingDebt ? String(existingDebt.remaining_amount) : "");
  const [isInstallment, setIsInstallment] = useState(existingDebt?.is_installment_based || false);
  const [monthlyInstallment, setMonthlyInstallment] = useState(existingDebt?.monthly_installment ? String(existingDebt.monthly_installment) : "");
  const [repaymentMonths, setRepaymentMonths] = useState(existingDebt?.repayment_months ? String(existingDebt.repayment_months) : "");
  const [repaymentMode, setRepaymentMode] = useState<RepaymentMode>("due_date");
  const [dueDate, setDueDate] = useState(existingDebt?.due_date ? dateToISO(new Date(existingDebt.due_date)) : "");
  const [startDate, setStartDate] = useState(existingDebt?.start_date ? dateToISO(new Date(existingDebt.start_date)) : dateToISO(new Date()));
  const [endDate, setEndDate] = useState(existingDebt?.end_date ? dateToISO(new Date(existingDebt.end_date)) : "");
  const [notes, setNotes] = useState(existingDebt?.notes || "");
  const [currency] = useState(existingDebt?.currency || appCurrency || "QAR");

  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteDebt = () => setShowConfirmDelete(true);
  const confirmDeleteDebt = () => {
    if (!existingDebt) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteDebt(existingDebt.id);
    showToast(t.toast.deleted, "info");
    router.back();
  };

  const CATEGORIES: { key: DebtCategory; label: string; icon: string; color: string }[] = [
    { key: "bank",     label: t.debts.categories.bank,     icon: CATEGORY_META.bank.icon,     color: CATEGORY_META.bank.color },
    { key: "personal", label: t.debts.categories.personal, icon: CATEGORY_META.personal.icon, color: CATEGORY_META.personal.color },
    { key: "company",  label: t.debts.categories.company,  icon: CATEGORY_META.company.icon,  color: CATEGORY_META.company.color },
  ];

  const subcategories = useMemo(() => CATEGORY_SUBCATEGORIES[category], [category]);

  const selectedSubDef = isCustomSub ? null : subcategories.find((s) => s.key === subcategory) || subcategories[0];

  function handleCategoryChange(cat: DebtCategory) {
    setCategory(cat);
    setIsCustomSub(false);
    setSubcategory(CATEGORY_SUBCATEGORIES[cat][0].key);
    setErrors({});
  }

  function handleSubcategorySelect(sub: SubcategoryDef) {
    setSubcategory(sub.key);
    setIsCustomSub(false);
    setErrors({});
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!entityName.trim()) newErrors.entityName = t.validation.nameRequired;
    if (!originalAmount || isNaN(parseFloat(originalAmount)) || parseFloat(originalAmount) <= 0) {
      newErrors.originalAmount = t.validation.amountRequired;
    }
    if (isCustomSub && !customSubNameAr.trim()) {
      newErrors.customName = t.validation.nameRequired;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);

    const origNum = parseFloat(originalAmount) || 0;
    const remainNum = remainingAmount ? parseFloat(remainingAmount) : origNum;
    const paidNum = origNum - remainNum;
    const monthlyNum = parseFloat(monthlyInstallment) || 0;
    const monthsNum = parseInt(repaymentMonths) || 0;
    const totalInstallments = monthsNum > 0 && isInstallment ? monthsNum : 0;

    const subDef = selectedSubDef;
    const subKey = isCustomSub ? "custom" : subcategory;
    const subAr = isCustomSub ? customSubNameAr.trim() : (subDef?.nameAr || "");
    const subEn = isCustomSub ? (customSubNameEn.trim() || customSubNameAr.trim()) : (subDef?.nameEn || "");
    const subIcon = isCustomSub ? customSubIcon : (subDef?.icon || "credit-card");
    const subColor = isCustomSub ? customSubColor : (subDef?.color || "#6B7280");

    const status: DebtStatus = (() => {
      if (isEdit && existingDebt?.status === "cancelled") return "cancelled";
      if (remainNum <= 0) return "completed";
      if (dueDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
        if (due < today) return "overdue";
      }
      return "active";
    })();

    const payload = {
      category,
      subcategory: subKey,
      subcategory_ar: subAr,
      subcategory_en: subEn,
      subcategory_icon: subIcon,
      subcategory_color: subColor,
      entity_name: entityName.trim(),
      original_amount: origNum,
      remaining_amount: remainNum,
      paid_amount: Math.max(0, paidNum),
      monthly_installment: monthlyNum,
      repayment_months: monthsNum,
      total_installments: totalInstallments,
      completed_installments: isEdit ? (existingDebt?.completed_installments || 0) : 0,
      is_installment_based: isInstallment,
      due_date: dueDate ? new Date(dueDate).toISOString() : "",
      start_date: startDate ? new Date(startDate).toISOString() : "",
      end_date: endDate ? new Date(endDate).toISOString() : "",
      notes: notes.trim(),
      status,
      currency,
    };

    if (isEdit && existingDebt) {
      updateDebt(existingDebt.id, payload);
    } else {
      addDebt(payload);
    }

    showToast(t.toast.saved, "success");
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      router.back();
    }, 700);
  }

  const textAlign = (isRTL ? "right" : "left") as "right" | "left";
  const webStyle = Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {};
  const inputStyle = {
    flex: 1,
    paddingVertical: 13,
    color: theme.text,
    fontSize: 14,
    textAlign,
    ...webStyle,
  };

  const rowStyle = {
    flexDirection: (isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
    alignItems: "center" as const,
    gap: 10,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
  };

  function LabelText({ text, required }: { text: string; required?: boolean }) {
    return (
      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
        {text}{required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="x" size={18} color={theme.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {isEdit ? t.debts.edit : t.debts.add}
        </Text>
        {isEdit ? (
          <Pressable
            onPress={handleDeleteDebt}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.expense + "15", borderWidth: 1, borderColor: theme.expense + "30", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="trash-2" size={18} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 50 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 20 }} />
        <View style={{ gap: 20 }}>
          <View style={{ gap: 8 }}>
            <LabelText text={t.debts.category} required />
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => handleCategoryChange(cat.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 14,
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: active ? cat.color + "18" : theme.card,
                      borderWidth: 1,
                      borderColor: active ? cat.color : theme.border,
                    }}
                  >
                    <Feather name={cat.icon as any} size={18} color={active ? cat.color : theme.textMuted} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: active ? cat.color : theme.textSecondary, textAlign: "center" }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <LabelText text={t.debts.subcategory} required />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}>
              {subcategories.map((sub) => {
                const active = !isCustomSub && subcategory === sub.key;
                return (
                  <Pressable
                    key={sub.key}
                    onPress={() => handleSubcategorySelect(sub)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? sub.color + "18" : theme.card,
                      borderWidth: 1,
                      borderColor: active ? sub.color : theme.border,
                    }}
                  >
                    <Feather name={sub.icon as any} size={14} color={active ? sub.color : theme.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: active ? sub.color : theme.textSecondary }}>
                      {language === "ar" ? sub.nameAr : sub.nameEn}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => { setIsCustomSub(true); setSubcategory("custom"); }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isCustomSub ? "#6B728018" : theme.card,
                  borderWidth: 1,
                  borderColor: isCustomSub ? "#6B7280" : theme.border,
                }}
              >
                <Feather name="plus" size={14} color={isCustomSub ? "#6B7280" : theme.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: isCustomSub ? "#6B7280" : theme.textSecondary }}>
                  {t.debts.customSubcategory}
                </Text>
              </Pressable>
            </ScrollView>

            {isCustomSub && (
              <View style={{ gap: 8, marginTop: 4, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.debts.customName}</Text>
                <TextInput
                  value={customSubNameAr}
                  onChangeText={(v) => { setCustomSubNameAr(v); setErrors((e) => ({ ...e, customName: "" })); }}
                  placeholder={language === "ar" ? "اسم النوع..." : "Type name..."}
                  placeholderTextColor={theme.textMuted}
                  style={{ color: theme.text, fontSize: 14, textAlign: isRTL ? "right" : "left", borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 6, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) }}
                />
                {errors.customName && <Text style={{ fontSize: 11, color: "#EF4444" }}>{errors.customName}</Text>}
              </View>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <LabelText text={t.debts.entityName} required />
            <View style={[rowStyle, { borderColor: errors.entityName ? "#EF4444" : theme.border }]}>
              <Feather name="user" size={16} color={theme.textMuted} />
              <TextInput
                value={entityName}
                onChangeText={(v) => { setEntityName(v); setErrors((e) => ({ ...e, entityName: "" })); }}
                placeholder={t.debts.entityNamePlaceholder}
                placeholderTextColor={theme.textMuted}
                style={inputStyle}
              />
            </View>
            {errors.entityName && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.entityName}</Text>}
          </View>

          <View style={{
            backgroundColor: errors.originalAmount ? "#EF444408" : theme.primary + "08",
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: errors.originalAmount ? "#EF4444" : theme.primary + "30",
            paddingVertical: 20,
            paddingHorizontal: 16,
            alignItems: "center",
            gap: 6,
          }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary, letterSpacing: 0.5 }}>
              {t.debts.originalAmount}
            </Text>
            <TextInput
              value={originalAmount}
              onChangeText={(v) => { setOriginalAmount(v); setErrors((e) => ({ ...e, originalAmount: "" })); }}
              placeholder="0.000"
              placeholderTextColor={theme.primary + "50"}
              keyboardType="decimal-pad"
              style={{
                width: "100%",
                fontSize: 48,
                fontWeight: "800",
                color: theme.primary,
                textAlign: "center",
                letterSpacing: -1,
                ...webStyle,
              }}
            />
            <Text style={{ fontSize: 12, color: theme.textMuted }}>{currency}</Text>
            {errors.originalAmount && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="alert-circle" size={12} color="#EF4444" />
                <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.originalAmount}</Text>
              </View>
            )}
          </View>

          {isEdit && (
            <View style={{ gap: 6 }}>
              <LabelText text={t.debts.remainingAmount} />
              <View style={rowStyle}>
                <Feather name="minus-circle" size={16} color={theme.textMuted} />
                <TextInput
                  value={remainingAmount}
                  onChangeText={setRemainingAmount}
                  placeholder="0.000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  style={{ ...inputStyle, fontSize: 16, fontWeight: "600" }}
                />
                <Text style={{ fontSize: 13, color: theme.textMuted }}>{currency}</Text>
              </View>
            </View>
          )}

          <View style={{ gap: 8 }}>
            <LabelText text={t.debts.repaymentType} />
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
              {([{ k: "due_date", l: t.debts.byDueDate }, { k: "months", l: t.debts.byMonths }] as const).map(({ k, l }) => (
                <Pressable
                  key={k}
                  onPress={() => setRepaymentMode(k as RepaymentMode)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: repaymentMode === k ? theme.primaryLight : theme.card,
                    borderWidth: 1,
                    borderColor: repaymentMode === k ? theme.primary : theme.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: repaymentMode === k ? theme.primary : theme.textSecondary }}>{l}</Text>
                </Pressable>
              ))}
            </View>

            {repaymentMode === "due_date" ? (
              <Pressable
                onPress={() => setShowDueDatePicker(true)}
                style={[rowStyle, { paddingVertical: 13 }]}
              >
                <Feather name="calendar" size={16} color={theme.textMuted} />
                <Text style={{ flex: 1, color: dueDate ? theme.text : theme.textMuted, fontSize: 14, textAlign: isRTL ? "right" : "left" }}>
                  {dueDate || t.debts.dueDate}
                </Text>
              </Pressable>
            ) : (
              <View style={rowStyle}>
                <Feather name="hash" size={16} color={theme.textMuted} />
                <TextInput
                  value={repaymentMonths}
                  onChangeText={setRepaymentMonths}
                  placeholder="12"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  style={inputStyle}
                />
                <Text style={{ fontSize: 13, color: theme.textMuted }}>{language === "ar" ? "شهر" : "months"}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
              <Feather name="repeat" size={16} color={theme.textMuted} />
              <Text style={{ fontSize: 14, color: theme.text }}>{t.debts.isInstallmentBased}</Text>
            </View>
            <Pressable
              onPress={() => setIsInstallment((v) => !v)}
              style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: isInstallment ? theme.primary : theme.cardSecondary, justifyContent: "center", paddingHorizontal: 2 }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: isInstallment ? (isRTL ? "flex-start" : "flex-end") : (isRTL ? "flex-end" : "flex-start") }} />
            </Pressable>
          </View>

          {isInstallment && (
            <View style={{ gap: 6 }}>
              <LabelText text={t.debts.monthlyInstallment} />
              <View style={rowStyle}>
                <Feather name="calendar" size={16} color={theme.textMuted} />
                <TextInput
                  value={monthlyInstallment}
                  onChangeText={setMonthlyInstallment}
                  placeholder="0.000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  style={{ ...inputStyle, fontSize: 15, fontWeight: "600" }}
                />
                <Text style={{ fontSize: 13, color: theme.textMuted }}>{currency}</Text>
              </View>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <LabelText text={t.debts.startDate} />
            <Pressable
              onPress={() => setShowStartDatePicker(true)}
              style={[rowStyle, { paddingVertical: 13 }]}
            >
              <Feather name="calendar" size={16} color={theme.textMuted} />
              <Text style={{ flex: 1, color: startDate ? theme.text : theme.textMuted, fontSize: 14, textAlign: isRTL ? "right" : "left" }}>
                {startDate || t.debts.startDate}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <LabelText text={t.debts.endDate} />
            <Pressable
              onPress={() => setShowEndDatePicker(true)}
              style={[rowStyle, { paddingVertical: 13 }]}
            >
              <Feather name="calendar" size={16} color={theme.textMuted} />
              <Text style={{ flex: 1, color: endDate ? theme.text : theme.textMuted, fontSize: 14, textAlign: isRTL ? "right" : "left" }}>
                {endDate || t.debts.endDate}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <LabelText text={t.debts.notes} />
            <View style={{ backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14 }}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t.debts.notesPlaceholder}
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                style={{ paddingVertical: 12, color: theme.text, fontSize: 14, textAlign: isRTL ? "right" : "left", minHeight: 80, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) }}
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
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{isEdit ? t.common.save : t.debts.add}</Text>
        </Pressable>
      </ScrollView>

      <DatePickerModal
        visible={showDueDatePicker}
        value={dueDate}
        onConfirm={(d) => { setDueDate(d); setShowDueDatePicker(false); }}
        onClose={() => setShowDueDatePicker(false)}
      />
      <DatePickerModal
        visible={showStartDatePicker}
        value={startDate}
        onConfirm={(d) => { setStartDate(d); setShowStartDatePicker(false); }}
        onClose={() => setShowStartDatePicker(false)}
      />
      <DatePickerModal
        visible={showEndDatePicker}
        value={endDate}
        onConfirm={(d) => { setEndDate(d); setShowEndDatePicker(false); }}
        onClose={() => setShowEndDatePicker(false)}
      />

      <SuccessOverlay
        visible={showSuccess}
        message={t.toast.saved}
        color={theme.primary}
      />

      <ConfirmDialog
        visible={showConfirmDelete}
        title={t.debts.delete}
        message={t.debts.deleteConfirm}
        onConfirm={confirmDeleteDebt}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </View>
  );
}
