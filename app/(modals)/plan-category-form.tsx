import React, { useState, useMemo } from "react";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  View,
  Text,
  Pressable,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { usePlans } from "@/store/PlansContext";
import { useTransactions } from "@/store/TransactionsContext";
import { BilingualNameInput } from "@/components/BilingualNameInput";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/utils/currency";

const CATEGORY_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981",
  "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4",
  "#84CC16", "#6366F1",
];

export default function PlanCategoryFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, showToast } = useApp();
  const { plans, planCategories, addPlanCategory, updatePlanCategory, deletePlanCategory, getPlanCategories, getPlanCategorySpent } = usePlans();
  const { transactions } = useTransactions();
  const params = useLocalSearchParams<{ planId?: string; categoryId?: string }>();

  const plan = plans.find((p) => p.id === params.planId);
  const existing = params.categoryId
    ? planCategories.find((pc) => pc.id === params.categoryId)
    : undefined;

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [budget, setBudget] = useState(existing ? String(existing.budget_amount) : "");
  const [color, setColor] = useState(existing?.color || CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(existing?.icon || "tag");
  const [showIcon, setShowIcon] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Calculate remaining budget for categories
  const allCategoriesForPlan = useMemo(
    () => (plan ? getPlanCategories(plan.id) : []),
    [plan, planCategories]
  );

  const totalAllocated = useMemo(() => {
    return allCategoriesForPlan
      .filter((pc) => pc.id !== existing?.id)
      .reduce((sum, pc) => sum + pc.budget_amount, 0);
  }, [allCategoriesForPlan, existing]);

  const availableBudget = plan ? plan.total_budget - totalAllocated : 0;

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!nameAr.trim() && !nameEn.trim()) err.name = t.validation.nameRequired;
    const budgetNum = parseFloat(budget);
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) {
      err.budget = t.validation.budgetRequired;
    } else if (budgetNum > availableBudget) {
      err.budget = t.plans.categoryBudgetExceeded;
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!plan) return;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const data = {
        plan_id: plan.id,
        name_ar: nameAr,
        name_en: nameEn,
        budget_amount: parseFloat(budget),
        color,
        icon,
      };
      if (existing) {
        updatePlanCategory(existing.id, data);
      } else {
        addPlanCategory(data);
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
    Alert.alert(t.common.areYouSure, t.plans.deleteCategory, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          if (existing) deletePlanCategory(existing.id);
          showToast(t.toast.deleted, "info");
          router.back();
        },
      },
    ]);
  };

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;
  const budgetNum = parseFloat(budget) || 0;
  const budgetProgress = plan && plan.total_budget > 0 ? Math.min((totalAllocated + budgetNum) / plan.total_budget, 1) : 0;

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.textMuted }}>{language === "ar" ? "الخطة غير موجودة" : "Plan not found"}</Text>
      </View>
    );
  }

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
          paddingBottom: 14,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {existing ? t.plans.editCategory : t.plans.addCategory}
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={60}
      >
        {/* Budget overview */}
        <View style={{ backgroundColor: plan.color + "15", borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: plan.color + "30" }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
              {language === "ar" ? "ميزانية الخطة" : "Plan Budget"}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: plan.color }}>
              {formatCurrency(plan.total_budget, plan.currency, language)}
            </Text>
          </View>
          <ProgressBar progress={budgetProgress} color={budgetProgress > 1 ? "#EF4444" : plan.color} height={5} backgroundColor={plan.color + "30"} />
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              {language === "ar" ? "موزّع: " : "Allocated: "}{formatCurrency(totalAllocated + budgetNum, plan.currency, language)}
            </Text>
            <Text style={{ fontSize: 12, color: availableBudget - budgetNum < 0 ? "#EF4444" : theme.textMuted }}>
              {language === "ar" ? "متبقي: " : "Available: "}{formatCurrency(Math.max(0, availableBudget - budgetNum), plan.currency, language)}
            </Text>
          </View>
        </View>

        {/* Icon & Color */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
          <Pressable
            onPress={() => setShowIcon(true)}
            style={{ flex: 1, backgroundColor: color + "15", borderRadius: 14, padding: 16, alignItems: "center", gap: 8, borderWidth: 2, borderColor: color }}
          >
            <Feather name={icon as any} size={32} color={color} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t.common.icon}</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowColor(true)}
            style={{ flex: 1, backgroundColor: color, borderRadius: 14, padding: 16, alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Feather name="droplet" size={28} color="#fff" />
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{t.common.color}</Text>
          </Pressable>
        </View>

        {/* Quick Color Picker */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORY_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => { Haptics.selectionAsync(); setColor(c); }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: "#fff",
                ...(Platform.OS === "web"
                  ? { boxShadow: `0 0 6px ${c}88` }
                  : { shadowColor: c, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 }),
              }}
            />
          ))}
        </View>

        {/* Name */}
        <BilingualNameInput
          nameAr={nameAr}
          nameEn={nameEn}
          onChangeAr={setNameAr}
          onChangeEn={setNameEn}
          errorAr={errors.name}
        />

        {/* Budget */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.plans.budget} <Text style={{ color: theme.expense }}>*</Text>
            {plan && (
              <Text style={{ fontSize: 11, fontWeight: "400", color: theme.textMuted }}>
                {" "}({language === "ar" ? "متاح: " : "available: "}{formatCurrency(availableBudget, plan.currency, language)})
              </Text>
            )}
          </Text>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.budget ? "#EF4444" : theme.inputBorder,
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              value={budget}
              onChangeText={(v) => { setBudget(v); if (errors.budget) setErrors((e) => ({ ...e, budget: "" })); }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 20,
                fontWeight: "700",
                color: color,
                textAlign: "center",
                ...Platform.select({ web: { outlineStyle: "none" } } as any),
              }}
            />
            <Text style={{ fontSize: 14, color: theme.textMuted, marginStart: 4 }}>
              {plan.currency}
            </Text>
          </View>
          {!!errors.budget && (
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
              <Feather name="alert-circle" size={12} color="#EF4444" />
              <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.budget}</Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{
            backgroundColor: color,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
            {existing ? t.common.save : t.plans.addCategory}
          </Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>

      <IconPicker selectedIcon={icon} onSelect={setIcon} visible={showIcon} onClose={() => setShowIcon(false)} />
      <ColorPicker selectedColor={color} onSelect={setColor} visible={showColor} onClose={() => setShowColor(false)} />
    </View>
  );
}
