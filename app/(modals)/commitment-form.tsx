import React, { useState } from "react";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  View,
  Text,
  Pressable,
  Alert,
  Modal,
  FlatList,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryPickerModal } from "@/components/CategoryPickerModal";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString, isValidDate } from "@/utils/date";
import { DatePickerModal } from "@/components/DatePickerModal";

export default function CommitmentFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, showToast } = useApp();
  const { commitments, addCommitment, updateCommitment, deleteCommitment } = useCommitments();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? commitments.find((c) => c.id === params.id) : undefined;
  const allCategories = [...categories];
  const activeAccounts = accounts.filter((a) => a.is_active);

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [accountId, setAccountId] = useState(
    existing?.account_id || activeAccounts.find((a) => a.is_active)?.id || ""
  );
  const [categoryId, setCategoryId] = useState(existing?.category_id || "");
  const [dueDate, setDueDate] = useState(existing?.due_date || todayISOString());
  const [note, setNote] = useState(existing?.note || "");
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const err: Record<string, string> = {};
    if (!nameAr.trim() && !nameEn.trim()) err.name = t.validation.nameRequired;
    if (!amount || parseFloat(amount) <= 0) err.amount = t.validation.amountPositive;
    if (!accountId) err.account = t.validation.accountRequired;
    if (!categoryId) err.category = t.validation.categoryRequired;
    if (!dueDate) err.date = t.validation.dateRequired;
    else if (!isValidDate(dueDate)) err.date = t.validation.dateInvalid;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const data = {
        name_ar: nameAr,
        name_en: nameEn,
        amount: parseFloat(amount),
        account_id: accountId,
        category_id: categoryId || allCategories[0]?.id || "",
        due_date: dueDate,
        recurrence_type: "none" as const,
        is_manual: true,
        note: note || "",
      };
      if (existing) {
        updateCommitment(existing.id, data);
      } else {
        addCommitment(data);
      }
      showToast(t.toast.saved);
      router.back();
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t.common.areYouSure, t.commitments.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          if (existing) deleteCommitment(existing.id);
          showToast(t.toast.deleted, "info");
          router.back();
        },
      },
    ]);
  };

  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const selectedCategory = allCategories.find((c) => c.id === categoryId);
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: topPadding,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {existing ? t.commitments.edit : t.commitments.add}
        </Text>
        {existing ? (
          <Pressable onPress={handleDelete} hitSlop={10}>
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={60}
      >
        {/* Name */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.name} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <View style={{ gap: 8 }}>
            <TextInput
              value={nameAr}
              onChangeText={setNameAr}
              placeholder={t.common.nameAr}
              placeholderTextColor={theme.textMuted}
              textAlign="right"
              style={{
                backgroundColor: theme.input,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: errors.name ? "#EF4444" : theme.inputBorder,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontSize: 15,
                color: theme.text,
                textAlign: "right",
                ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
              }}
            />
            <TextInput
              value={nameEn}
              onChangeText={setNameEn}
              placeholder="Name in English"
              placeholderTextColor={theme.textMuted}
              style={{
                backgroundColor: theme.input,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: errors.name ? "#EF4444" : theme.inputBorder,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontSize: 15,
                color: theme.text,
                ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
              }}
            />
          </View>
          {!!errors.name && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.name}</Text>}
        </View>

        {/* Amount */}
        <View style={{
          backgroundColor: errors.amount ? "#EF444408" : theme.expense + "08",
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: errors.amount ? "#EF4444" : theme.expense + "30",
          paddingVertical: 20,
          paddingHorizontal: 16,
          alignItems: "center",
          gap: 6,
        }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.expense, letterSpacing: 0.5 }}>
            {t.common.amount}
          </Text>
          <TextInput
            value={amount}
            onChangeText={(v) => { setAmount(v); if (errors.amount) setErrors((e) => ({ ...e, amount: "" })); }}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.expense + "50"}
            style={{
              width: "100%",
              fontSize: 48,
              fontWeight: "800",
              color: theme.expense,
              textAlign: "center",
              letterSpacing: -1,
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
          />
          {!!errors.amount && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="alert-circle" size={12} color="#EF4444" />
              <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.amount}</Text>
            </View>
          )}
        </View>

        {/* Account Picker */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.transactions.account} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowAccounts(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.account ? "#EF4444" : theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            {selectedAccount && (
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color }} />
            )}
            <Text style={{ flex: 1, color: selectedAccount ? theme.text : theme.textMuted, fontSize: 15 }}>
              {selectedAccount ? getDisplayName(selectedAccount, language) : t.transactions.selectAccount}
            </Text>
            {selectedAccount && (
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                {formatCurrency(selectedAccount.balance, selectedAccount.currency, language)}
              </Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {!!errors.account && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.account}</Text>}
        </View>

        {/* Category Picker */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.categories.title} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowCategories(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.category ? "#EF4444" : theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            {selectedCategory && (
              <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: selectedCategory.color + "20", alignItems: "center", justifyContent: "center" }}>
                <CategoryIcon name={selectedCategory.icon || "tag"} size={15} color={selectedCategory.color} />
              </View>
            )}
            <Text style={{ flex: 1, color: selectedCategory ? theme.text : theme.textMuted, fontSize: 15 }}>
              {selectedCategory
                ? getDisplayName(selectedCategory, language)
                : t.transactions.selectCategory}
            </Text>
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {!!errors.category && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.category}</Text>}
        </View>

        {/* Due Date */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.commitments.dueDate} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.date ? "#EF4444" : theme.inputBorder,
              paddingHorizontal: 14,
              paddingVertical: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Feather name="calendar" size={16} color={theme.primary} />
            <Text style={{ flex: 1, fontSize: 15, color: theme.text, textAlign: isRTL ? "right" : "left" }}>
              {dueDate}
            </Text>
            <Feather name="chevron-down" size={14} color={theme.textMuted} />
          </Pressable>
          {!!errors.date && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.date}</Text>}
        </View>

        {/* Note */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.note} ({t.common.optional})
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t.common.notePlaceholder}
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.inputBorder,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: theme.text,
              textAlign: isRTL ? "right" : "left",
              minHeight: 80,
              textAlignVertical: "top",
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{
            backgroundColor: theme.commitment,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {loading && <ActivityIndicator size="small" color="#fff" />}
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
            {existing ? t.common.save : t.commitments.add}
          </Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>

      {/* Account Selector Modal */}
      <Modal visible={showAccounts} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={() => setShowAccounts(false)}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%", paddingVertical: 8, paddingBottom: insets.bottom + 8 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.transactions.selectAccount}</Text>
              <Pressable onPress={() => setShowAccounts(false)} hitSlop={8}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={activeAccounts}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setAccountId(item.id); setShowAccounts(false); }}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    backgroundColor: item.id === accountId ? theme.primaryLight : "transparent",
                    borderRadius: 12,
                    marginHorizontal: 8,
                    marginVertical: 2,
                  }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
                  <Text style={{ flex: 1, color: theme.text, fontWeight: "500" }}>{getDisplayName(item, language)}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatCurrency(item.balance, item.currency, language)}</Text>
                  {item.id === accountId && <Feather name="check" size={16} color={theme.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Category Selector Modal */}
      <CategoryPickerModal
        visible={showCategories}
        onClose={() => setShowCategories(false)}
        categories={allCategories}
        selectedId={categoryId}
        onSelect={(id) => {
          Haptics.selectionAsync();
          setCategoryId(id);
        }}
        theme={theme}
        insets={insets}
        language={language}
        isRTL={isRTL}
        noDataText={t.categories.noCategories}
        title={t.transactions.selectCategory}
      />

      <DatePickerModal
        visible={showDatePicker}
        value={dueDate}
        onConfirm={(d) => { setDueDate(d); if (errors.date) setErrors((e) => ({ ...e, date: "" })); }}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  );
}
