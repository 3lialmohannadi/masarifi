import React, { useState } from "react";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  View,
  Text,
  ScrollView,
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
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString } from "@/utils/date";
import type { RecurrenceType } from "@/types";

function isValidDate(str: string): boolean {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export default function CommitmentFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { commitments, addCommitment, updateCommitment, deleteCommitment } = useCommitments();
  const { accounts } = useAccounts();
  const { getCategoriesByType } = useCategories();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? commitments.find((c) => c.id === params.id) : undefined;
  const commitmentCategories = getCategoriesByType("commitment");
  const activeAccounts = accounts.filter((a) => a.is_active);

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [accountId, setAccountId] = useState(
    existing?.account_id || activeAccounts.find((a) => a.is_active)?.id || ""
  );
  const [categoryId, setCategoryId] = useState(
    existing?.category_id || commitmentCategories[0]?.id || ""
  );
  const [dueDate, setDueDate] = useState(existing?.due_date || todayISOString());
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    existing?.recurrence_type || "monthly"
  );
  const [note, setNote] = useState(existing?.note || "");
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const RECURRENCE_TYPES: { key: RecurrenceType; labelKey: string }[] = [
    { key: "none", labelKey: "none" },
    { key: "daily", labelKey: "daily" },
    { key: "weekly", labelKey: "weekly" },
    { key: "monthly", labelKey: "monthly" },
    { key: "yearly", labelKey: "yearly" },
  ];

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
        category_id: categoryId || commitmentCategories[0]?.id || "",
        due_date: dueDate,
        recurrence_type: recurrence,
        is_manual: recurrence === "none",
        note: note || "",
      };
      if (existing) {
        updateCommitment(existing.id, data);
      } else {
        addCommitment(data);
      }
      router.back();
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
          router.back();
        },
      },
    ]);
  };

  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const selectedCategory = commitmentCategories.find((c) => c.id === categoryId);
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
        bottomOffset={20}
      >
        {/* Commitment type indicator */}
        <View
          style={{
            backgroundColor: recurrence === "none" ? theme.warningBackground : theme.commitment + "15",
            borderRadius: 12,
            padding: 12,
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 10,
            borderWidth: 1,
            borderColor: recurrence === "none" ? theme.warningBorder : theme.commitment + "40",
          }}
        >
          <Feather
            name={recurrence === "none" ? "calendar" : "repeat"}
            size={16}
            color={recurrence === "none" ? theme.warningText : theme.commitment}
          />
          <Text style={{ fontSize: 13, color: recurrence === "none" ? theme.warningText : theme.commitment, fontWeight: "600" }}>
            {recurrence === "none"
              ? (language === "ar" ? "التزام يدوي (مرة واحدة)" : "Manual Commitment (One-time)")
              : (language === "ar" ? "التزام متكرر" : "Recurring Commitment")}
          </Text>
        </View>

        {/* Name */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {language === "ar" ? "الاسم" : "Name"} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <View style={{ gap: 8 }}>
            <TextInput
              value={nameAr}
              onChangeText={setNameAr}
              placeholder={language === "ar" ? "الاسم بالعربي" : "Name in Arabic"}
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
                ...Platform.select({ web: { outlineStyle: "none" } } as any),
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
                ...Platform.select({ web: { outlineStyle: "none" } } as any),
              }}
            />
          </View>
          {!!errors.name && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.name}</Text>}
        </View>

        {/* Amount */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.amount} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.textMuted}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.amount ? "#EF4444" : theme.inputBorder,
              paddingHorizontal: 14,
              paddingVertical: 13,
              fontSize: 18,
              fontWeight: "700",
              color: theme.expense,
              textAlign: "center",
              ...Platform.select({ web: { outlineStyle: "none" } } as any),
            }}
          />
          {!!errors.amount && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.amount}</Text>}
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
                <Feather name={(selectedCategory.icon || "tag") as any} size={15} color={selectedCategory.color} />
              </View>
            )}
            <Text style={{ flex: 1, color: selectedCategory ? theme.text : theme.textMuted, fontSize: 15 }}>
              {selectedCategory
                ? (language === "ar" ? selectedCategory.name_ar || selectedCategory.name_en : selectedCategory.name_en || selectedCategory.name_ar)
                : (language === "ar" ? "اختر فئة" : "Select Category")}
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
          <TextInput
            value={dueDate}
            onChangeText={(v) => { setDueDate(v); if (errors.date) setErrors((e) => ({ ...e, date: "" })); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.textMuted}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.date ? "#EF4444" : theme.inputBorder,
              paddingHorizontal: 14,
              paddingVertical: 13,
              fontSize: 15,
              color: theme.text,
              textAlign: isRTL ? "right" : "left",
              ...Platform.select({ web: { outlineStyle: "none" } } as any),
            }}
          />
          {!!errors.date && <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.date}</Text>}
        </View>

        {/* Recurrence */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.commitments.recurrence}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {RECURRENCE_TYPES.map(({ key }) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRecurrence(key);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: recurrence === key ? theme.commitment : theme.card,
                    borderWidth: 1.5,
                    borderColor: recurrence === key ? theme.commitment : theme.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {key !== "none" && (
                    <Feather name="repeat" size={12} color={recurrence === key ? "#fff" : theme.textSecondary} />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: "600", color: recurrence === key ? "#fff" : theme.text }}>
                    {t.commitments.recurrenceTypes[key]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Note */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.note} ({t.common.optional})
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={language === "ar" ? "ملاحظة..." : "Note..."}
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
              ...Platform.select({ web: { outlineStyle: "none" } } as any),
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
      <Modal visible={showCategories} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={() => setShowCategories(false)}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "65%", paddingVertical: 8, paddingBottom: insets.bottom + 8 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
                {language === "ar" ? "اختر فئة الالتزام" : "Select Commitment Category"}
              </Text>
              <Pressable onPress={() => setShowCategories(false)} hitSlop={8}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={commitmentCategories}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setCategoryId(item.id); setShowCategories(false); }}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    backgroundColor: item.id === categoryId ? item.color + "15" : "transparent",
                    borderRadius: 12,
                    marginHorizontal: 8,
                    marginVertical: 2,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + "20", alignItems: "center", justifyContent: "center" }}>
                    <Feather name={(item.icon || "tag") as any} size={18} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, color: theme.text, fontWeight: "500", fontSize: 15 }}>
                    {language === "ar" ? item.name_ar || item.name_en : item.name_en || item.name_ar}
                  </Text>
                  {item.id === categoryId && <Feather name="check" size={16} color={item.color} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
