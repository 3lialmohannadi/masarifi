import React, { useState } from "react";
import { View, Text, Pressable, FlatList, Modal, Platform } from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useBudgets } from "@/store/BudgetsContext";
import { useCategories } from "@/store/CategoriesContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { getDisplayName } from "@/utils/display";
import { monthYearToMonthKey } from "@/utils/date";
import { getCurrentMonthYear } from "@/utils/date";
import { MONTH_NAMES_AR, MONTH_NAMES_EN } from "@/hooks/useMonthPicker";

export default function BudgetFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, showToast } = useApp();
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();
  const params = useLocalSearchParams<{ id?: string; monthKey?: string }>();

  const existing = params.id ? budgets.find((b) => b.id === params.id) : undefined;
  const expenseCategories = categories.filter((c) => c.type === "expense" && c.is_active);

  const { month: nowMonth, year: nowYear } = getCurrentMonthYear();

  const initMonth = (() => {
    if (existing?.month) return parseInt(existing.month.split("-")[1]);
    if (params.monthKey) return parseInt(params.monthKey.split("-")[1]);
    return nowMonth;
  })();
  const initYear = (() => {
    if (existing?.month) return parseInt(existing.month.split("-")[0]);
    if (params.monthKey) return parseInt(params.monthKey.split("-")[0]);
    return nowYear;
  })();

  const [categoryId, setCategoryId] = useState(existing?.category_id || "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [budgetMonth, setBudgetMonth] = useState(initMonth);
  const [budgetYear, setBudgetYear] = useState(initYear);
  const [showCategories, setShowCategories] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCategory = expenseCategories.find((c) => c.id === categoryId);
  const monthKey = monthYearToMonthKey(budgetMonth, budgetYear);
  const MONTH_NAMES = language === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN;
  const monthName = MONTH_NAMES[budgetMonth - 1];

  const goToPrev = () => {
    if (budgetMonth === 1) { setBudgetMonth(12); setBudgetYear((y) => y - 1); }
    else setBudgetMonth((m) => m - 1);
  };
  const goToNext = () => {
    if (budgetMonth === 12) { setBudgetMonth(1); setBudgetYear((y) => y + 1); }
    else setBudgetMonth((m) => m + 1);
  };

  const duplicateExists = !existing && budgets.find(
    (b) => b.category_id === categoryId && b.month === monthKey
  );

  const validate = () => {
    const err: Record<string, string> = {};
    if (!categoryId) err.category = t.validation.categoryRequired;
    if (!amount || parseFloat(amount) <= 0) err.amount = t.validation.amountPositive;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = { category_id: categoryId, amount: parseFloat(amount), month: monthKey };
      if (existing) {
        updateBudget(existing.id, data);
      } else {
        addBudget(data);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (existing) deleteBudget(existing.id);
    setShowDeleteConfirm(false);
    showToast(t.toast.deleted, "info");
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {existing ? t.budget.edit : t.budget.add}
        </Text>
        {existing ? (
          <Pressable testID="budget-delete-btn" onPress={handleDelete} hitSlop={8}>
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 34 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Month Picker */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.budget.month}
          </Text>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.card,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: theme.inputBorder,
            overflow: "hidden",
          }}>
            <Pressable
              onPress={goToPrev}
              style={({ pressed }) => ({
                width: 44, height: 50,
                alignItems: "center", justifyContent: "center",
                backgroundColor: pressed ? theme.cardSecondary : "transparent",
              })}
            >
              <Feather name="chevron-left" size={20} color={theme.text} />
            </Pressable>
            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                {monthName}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                {budgetYear}
              </Text>
            </View>
            <Pressable
              onPress={goToNext}
              style={({ pressed }) => ({
                width: 44, height: 50,
                alignItems: "center", justifyContent: "center",
                backgroundColor: pressed ? theme.cardSecondary : "transparent",
              })}
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {/* Category Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.transactions.category}
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
              justifyContent: "space-between",
            }}
          >
            {selectedCategory ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${selectedCategory.color}20`, alignItems: "center", justifyContent: "center" }}>
                  <Feather name={selectedCategory.icon as any} size={14} color={selectedCategory.color} />
                </View>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>
                  {getDisplayName(selectedCategory, language)}
                </Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted }}>{t.transactions.selectCategory}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.category && (
            <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{errors.category}</Text>
          )}
        </View>

        {/* Duplicate warning */}
        {!!duplicateExists && (
          <View style={{ backgroundColor: "#F59E0B15", borderRadius: 12, padding: 12, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#F59E0B30" }}>
            <Feather name="info" size={14} color="#F59E0B" />
            <Text style={{ flex: 1, fontSize: 13, color: "#F59E0B", fontWeight: "600" }}>
              {language === "ar"
                ? `توجد ميزانية لهذه الفئة في ${monthName} ${budgetYear}، سيتم تحديثها`
                : `A budget for this category in ${monthName} ${budgetYear} exists and will be updated`}
            </Text>
          </View>
        )}

        {/* Amount */}
        <AppInput
          label={t.budget.amount}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          error={errors.amount}
        />

        {/* Preview Card */}
        {!!categoryId && !!amount && parseFloat(amount) > 0 && (
          <View style={{ backgroundColor: theme.primaryLight, borderRadius: 14, padding: 14, gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary, textAlign: isRTL ? "right" : "left" }}>
              {language === "ar" ? "معاينة" : "Preview"}
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                {selectedCategory ? getDisplayName(selectedCategory, language) : ""}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.primary }}>
                {monthName} {budgetYear}
              </Text>
            </View>
          </View>
        )}

        <AppButton title={t.common.save} onPress={handleSave} loading={loading} fullWidth size="lg" />
      </KeyboardAwareScrollViewCompat>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24, zIndex: 999,
        }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20, gap: 16 }}>
            <View style={{ alignItems: "center", gap: 10 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.expense + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="trash-2" size={24} color={theme.expense} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: "center" }}>
                {t.budget.delete}
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center" }}>
                {t.budget.deleteConfirm}
              </Text>
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
              <Pressable
                testID="budget-cancel-delete"
                onPress={() => setShowDeleteConfirm(false)}
                style={({ pressed }) => ({
                  flex: 1, padding: 13, borderRadius: 12, alignItems: "center",
                  backgroundColor: pressed ? theme.border : theme.cardSecondary,
                  borderWidth: 1, borderColor: theme.border,
                })}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable
                testID="budget-confirm-delete"
                onPress={confirmDelete}
                style={({ pressed }) => ({
                  flex: 1, padding: 13, borderRadius: 12, alignItems: "center",
                  backgroundColor: pressed ? "#DC2626" : theme.expense,
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{t.common.delete}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Category Modal */}
      <Modal visible={showCategories} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingVertical: 8 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.transactions.selectCategory}</Text>
              <Pressable onPress={() => setShowCategories(false)} hitSlop={8}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={expenseCategories}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setCategoryId(item.id); setShowCategories(false); setErrors((e) => ({ ...e, category: "" })); }}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    backgroundColor: item.id === categoryId ? theme.primaryLight : "transparent",
                    borderRadius: 12,
                    marginHorizontal: 8,
                    marginVertical: 2,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: `${item.color}20`, alignItems: "center", justifyContent: "center" }}>
                    <Feather name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, color: theme.text, fontWeight: "500", textAlign: isRTL ? "right" : "left" }}>
                    {getDisplayName(item, language)}
                  </Text>
                  {item.id === categoryId && <Feather name="check" size={18} color={theme.primary} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
