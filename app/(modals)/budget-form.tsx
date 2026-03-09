import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, FlatList, Modal } from "react-native";
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
import { getMonthKey, getMonthName, monthKeyToMonthYear, monthYearToMonthKey } from "@/utils/date";

export default function BudgetFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? budgets.find((b) => b.id === params.id) : undefined;
  const expenseCategories = categories.filter((c) => c.type === "expense" && c.is_active);
  const currentMonthKey = getMonthKey();
  const { month: currentMonth, year: currentYear } = monthKeyToMonthYear(currentMonthKey);

  const [categoryId, setCategoryId] = useState(existing?.category_id || "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [budgetMonth, setBudgetMonth] = useState(() => {
    if (existing?.month) {
      const { month } = monthKeyToMonthYear(existing.month);
      return month;
    }
    return currentMonth;
  });
  const [budgetYear, setBudgetYear] = useState(() => {
    if (existing?.month) {
      const { year } = monthKeyToMonthYear(existing.month);
      return year;
    }
    return currentYear;
  });
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCategory = expenseCategories.find((c) => c.id === categoryId);
  const monthKey = monthYearToMonthKey(budgetMonth, budgetYear);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!categoryId) err.category = t.validation.categoryRequired;
    if (!amount || parseFloat(amount) <= 0) err.amount = t.validation.amountPositive;
    if (budgetMonth < 1 || budgetMonth > 12) err.month = t.validation.dateRequired;
    if (budgetYear < 2020) err.year = t.validation.dateRequired;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = {
        category_id: categoryId,
        amount: parseFloat(amount),
        month: monthKey,
      };
      if (existing) {
        updateBudget(existing.id, data);
      } else {
        addBudget(data);
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t.common.areYouSure, t.budget.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          if (existing) deleteBudget(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {existing ? t.budget.edit : t.budget.add}
        </Text>
        {existing ? (
          <Pressable onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 30 }}>
        {/* Month display */}
        <View style={{ backgroundColor: theme.primaryLight, borderRadius: 14, padding: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: theme.primary }}>
            {getMonthName(monthKey, language)}
          </Text>
        </View>

        {/* Month & Year */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppInput
              label={t.budget.month}
              value={String(budgetMonth)}
              onChangeText={(v) => {
                const n = parseInt(v);
                if (!isNaN(n)) setBudgetMonth(Math.min(12, Math.max(1, n)));
              }}
              keyboardType="numeric"
              placeholder="1-12"
              error={errors.month}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label={t.budget.year}
              value={String(budgetYear)}
              onChangeText={(v) => {
                const n = parseInt(v);
                if (!isNaN(n)) setBudgetYear(n);
              }}
              keyboardType="numeric"
              placeholder={String(currentYear)}
              error={errors.year}
            />
          </View>
        </View>

        {/* Category Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.transactions.category}
          </Text>
          <Pressable
            onPress={() => setShowCategories(true)}
            style={{ backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: errors.category ? "#EF4444" : theme.inputBorder, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
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
          {errors.category && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.category}</Text>}
        </View>

        <AppInput
          label={t.budget.amount}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          error={errors.amount}
        />

        <AppButton title={t.common.save} onPress={handleSave} loading={loading} fullWidth size="lg" />
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCategories} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingVertical: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.transactions.selectCategory}</Text>
              <Pressable onPress={() => setShowCategories(false)}><Feather name="x" size={22} color={theme.textSecondary} /></Pressable>
            </View>
            <FlatList
              data={expenseCategories}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setCategoryId(item.id); setShowCategories(false); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: item.id === categoryId ? theme.primaryLight : "transparent", borderRadius: 12, marginHorizontal: 8, marginVertical: 2 }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: `${item.color}20`, alignItems: "center", justifyContent: "center" }}>
                    <Feather name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, color: theme.text, fontWeight: "500" }}>{getDisplayName(item, language)}</Text>
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
