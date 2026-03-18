import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCategories } from "@/store/CategoriesContext";
import { useBudgets } from "@/store/BudgetsContext";
import { getDisplayName } from "@/utils/display";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatCurrency } from "@/utils/currency";

function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, settings, showToast } = useApp();
  const { getCategory } = useCategories();
  const { getBudgetForCategory, upsertBudget, deleteBudget } = useBudgets();

  const params = useLocalSearchParams<{ categoryId: string; month?: string }>();
  const categoryId = params.categoryId;
  const monthKey = params.month || getCurrentMonthKey();

  const category = getCategory(categoryId);
  const existingBudget = getBudgetForCategory(categoryId, monthKey);

  const [amountText, setAmountText] = useState(
    existingBudget ? String(existingBudget.amount) : ""
  );
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timeout);
  }, []);

  const primaryCurrency = settings.default_currency || "QAR";

  const handleSave = () => {
    const amount = parseFloat(amountText.replace(/,/g, "."));
    if (isNaN(amount) || amount <= 0) {
      showToast(language === "ar" ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount", "error");
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    upsertBudget(categoryId, amount, monthKey);
    showToast(t.categories.budgetSaved, "success");
    router.back();
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!existingBudget) return;
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (!existingBudget) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteBudget(existingBudget.id);
    showToast(t.categories.budgetDeleted, "success");
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 20,
              paddingBottom: 16,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 12,
              borderBottomWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="x" size={18} color={theme.text} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: "700",
                color: theme.text,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {existingBudget ? t.categories.budgetEdit : t.categories.budgetSet}
            </Text>
          </View>

          <View style={{ padding: 20, gap: 24 }}>
            {/* Category info */}
            {category && (
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: category.color + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CategoryIcon name={category.icon} size={22} color={category.color} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: "600",
                    color: theme.text,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {getDisplayName(category, language)}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: theme.primary + "18",
                  }}
                >
                  <Text style={{ fontSize: 11, color: theme.primary, fontWeight: "600" }}>
                    {monthKey}
                  </Text>
                </View>
              </View>
            )}

            {/* Amount input */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.textMuted,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {t.categories.budgetAmount}
              </Text>
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  backgroundColor: theme.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.primary }}>
                  {primaryCurrency}
                </Text>
                <TextInput
                  ref={inputRef}
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  style={{
                    flex: 1,
                    fontSize: 28,
                    fontWeight: "700",
                    color: theme.text,
                    paddingVertical: 14,
                    textAlign: isRTL ? "right" : "left",
                  }}
                />
              </View>
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.primary + "CC" : theme.primary,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                {t.common.save}
              </Text>
            </Pressable>

            {/* Delete button */}
            {existingBudget && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.expense + "40",
                  backgroundColor: pressed ? theme.expenseBackground : "transparent",
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.expense }}>
                  {t.categories.budgetDelete}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={showConfirmDelete}
          title={t.categories.budgetDelete}
          message={language === "ar" ? "إزالة الميزانية لهذا الشهر؟" : "Remove budget for this month?"}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
