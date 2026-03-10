import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, FlatList, Modal, Platform } from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { usePlans } from "@/store/PlansContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { BilingualNameInput } from "@/components/BilingualNameInput";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import { CURRENCIES } from "@/utils/currency";
import { todayISOString } from "@/utils/date";
import type { PlanType } from "@/types";

function isValidDate(str: string): boolean {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

const PLAN_TYPES: PlanType[] = ["travel", "wedding", "car", "house", "study", "business", "event", "medical", "other"];

export default function PlanFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { plans, addPlan, updatePlan, deletePlan } = usePlans();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? plans.find((p) => p.id === params.id) : undefined;

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [planType, setPlanType] = useState<PlanType>(existing?.plan_type || "travel");
  const [description, setDescription] = useState(existing?.description || "");
  const [startDate, setStartDate] = useState(existing?.start_date || todayISOString());
  const [endDate, setEndDate] = useState(existing?.end_date || "");
  const [budget, setBudget] = useState(existing ? String(existing.total_budget) : "");
  const [currency, setCurrency] = useState(existing?.currency || "QAR");
  const [color, setColor] = useState(existing?.color || "#8B5CF6");
  const [icon, setIcon] = useState(existing?.icon || "target");
  const [showIcon, setShowIcon] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const err: Record<string, string> = {};
    if (!nameAr.trim() && !nameEn.trim()) err.name = t.validation.nameRequired;
    if (!budget || parseFloat(budget) <= 0) err.budget = t.validation.budgetRequired;
    if (!currency) err.currency = t.validation.currencyRequired;
    if (!startDate) err.startDate = t.validation.dateRequired;
    else if (!isValidDate(startDate)) err.startDate = t.validation.dateInvalid;
    if (endDate && !isValidDate(endDate)) err.endDate = t.validation.dateInvalid;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = {
        name_ar: nameAr,
        name_en: nameEn,
        plan_type: planType,
        description,
        start_date: startDate,
        end_date: endDate,
        total_budget: parseFloat(budget),
        currency,
        color,
        icon,
      };
      if (existing) {
        updatePlan(existing.id, data);
      } else {
        addPlan(data);
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t.common.areYouSure, t.plans.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          if (existing) deletePlan(existing.id);
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
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
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
          {existing ? t.plans.edit : t.plans.add}
        </Text>
        {existing ? (
          <Pressable onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 30 }} bottomOffset={20} keyboardShouldPersistTaps="handled">
        {/* Icon & Color Row */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
          <Pressable
            onPress={() => setShowIcon(true)}
            style={{ flex: 1, backgroundColor: color + "20", borderRadius: 14, padding: 16, alignItems: "center", gap: 8, borderWidth: 2, borderColor: color }}
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

        <BilingualNameInput nameAr={nameAr} nameEn={nameEn} onChangeAr={setNameAr} onChangeEn={setNameEn} errorAr={errors.name} />

        {/* Plan Type */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.common.type}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {PLAN_TYPES.map((pt) => (
                <Pressable
                  key={pt}
                  onPress={() => setPlanType(pt)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: planType === pt ? theme.plan : theme.card, borderWidth: 1, borderColor: planType === pt ? theme.plan : theme.border }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: planType === pt ? "#fff" : theme.text }}>{t.plans.types[pt]}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <AppInput label={`${t.common.description} (${t.common.optional})`} value={description} onChangeText={setDescription} multiline placeholder={language === "ar" ? "وصف الخطة..." : "Plan description..."} />

        <AppInput
          label={t.plans.startDate}
          value={startDate}
          onChangeText={(v) => { setStartDate(v); if (errors.startDate) setErrors((e) => ({ ...e, startDate: "" })); }}
          placeholder="YYYY-MM-DD"
          error={errors.startDate}
        />
        <AppInput
          label={`${t.plans.endDate} (${t.common.optional})`}
          value={endDate}
          onChangeText={(v) => { setEndDate(v); if (errors.endDate) setErrors((e) => ({ ...e, endDate: "" })); }}
          placeholder="YYYY-MM-DD"
          error={errors.endDate}
        />

        <AppInput label={t.plans.budget} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder="0.00" error={errors.budget} />

        {/* Currency */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.common.currency}</Text>
          <Pressable
            onPress={() => setShowCurrency(true)}
            style={{ backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: errors.currency ? "#EF4444" : theme.inputBorder, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={{ color: currency ? theme.text : theme.textMuted, fontSize: 15, fontWeight: "600" }}>{currency || t.validation.currencyRequired}</Text>
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.currency && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.currency}</Text>}
        </View>

        <AppButton title={t.common.save} onPress={handleSave} loading={loading} fullWidth size="lg" />
      </KeyboardAwareScrollViewCompat>

      <IconPicker selectedIcon={icon} onSelect={setIcon} visible={showIcon} onClose={() => setShowIcon(false)} />
      <ColorPicker selectedColor={color} onSelect={setColor} visible={showColor} onClose={() => setShowColor(false)} />

      <Modal visible={showCurrency} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.common.currency}</Text>
              <Pressable onPress={() => setShowCurrency(false)}><Feather name="x" size={22} color={theme.textSecondary} /></Pressable>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setCurrency(item.code); setShowCurrency(false); }}
                  style={{ flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: currency === item.code ? theme.primaryLight : "transparent", marginHorizontal: 8, borderRadius: 12, marginVertical: 2 }}
                >
                  <Text style={{ width: 50, fontSize: 20, fontWeight: "700", color: theme.primary }}>{item.symbol}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>{item.code}</Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>{language === "ar" ? item.nameAr : item.nameEn}</Text>
                  </View>
                  {currency === item.code && <Feather name="check" size={18} color={theme.primary} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
