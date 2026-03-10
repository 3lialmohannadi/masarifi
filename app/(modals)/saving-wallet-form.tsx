import React, { useState } from "react";
import { View, Text, Pressable, Alert, Switch, Platform } from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useSavings } from "@/store/SavingsContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { BilingualNameInput } from "@/components/BilingualNameInput";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import type { SavingsWalletType } from "@/types";

function isValidDate(str: string): boolean {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export default function SavingWalletFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, showToast } = useApp();
  const { wallets, addWallet, updateWallet, deleteWallet } = useSavings();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? wallets.find((w) => w.id === params.id) : undefined;
  const isDefault = existing?.is_default || false;

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [walletType, setWalletType] = useState<SavingsWalletType>(existing?.type || "goal_savings");
  const [targetAmount, setTargetAmount] = useState(existing?.target_amount ? String(existing.target_amount) : "");
  const [targetDate, setTargetDate] = useState(existing?.target_date || "");
  const [color, setColor] = useState(existing?.color || "#3B82F6");
  const [icon, setIcon] = useState(existing?.icon || "dollar-sign");
  const [showIcon, setShowIcon] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const err: Record<string, string> = {};
    if (!nameAr.trim() && !nameEn.trim()) err.name = t.validation.nameRequired;
    if (walletType === "goal_savings" && (!targetAmount || parseFloat(targetAmount) <= 0)) {
      err.targetAmount = t.validation.targetAmountRequired;
    }
    if (targetDate && !isValidDate(targetDate)) err.targetDate = t.validation.dateInvalid;
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
        description,
        type: isDefault ? "general_savings" as const : walletType,
        current_amount: existing?.current_amount || 0,
        target_amount: walletType === "goal_savings" ? parseFloat(targetAmount) : undefined,
        target_date: walletType === "goal_savings" && targetDate ? targetDate : undefined,
        color,
        icon,
        is_default: isDefault,
        is_archived: false,
      };
      if (existing) {
        updateWallet(existing.id, data);
      } else {
        addWallet(data);
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
    if (isDefault) return;
    Alert.alert(t.common.areYouSure, t.savings.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          if (existing) deleteWallet(existing.id);
          showToast(t.toast.deleted, "info");
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
          {existing ? t.savings.edit : t.savings.add}
        </Text>
        {existing && !isDefault ? (
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

        <AppInput
          label={`${t.common.description} (${t.common.optional})`}
          value={description}
          onChangeText={setDescription}
          placeholder={language === "ar" ? "وصف المحفظة..." : "Wallet description..."}
          multiline
        />

        {/* Type Toggle (only for new wallets) */}
        {!isDefault && !existing && (
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
            {(["goal_savings", "general_savings"] as SavingsWalletType[]).map((wt) => (
              <Pressable
                key={wt}
                onPress={() => setWalletType(wt)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: walletType === wt ? theme.savings : theme.card,
                  borderWidth: 1,
                  borderColor: walletType === wt ? theme.savings : theme.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: walletType === wt ? "#fff" : theme.text }}>
                  {t.savings.types[wt]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {walletType === "goal_savings" && !isDefault && (
          <>
            <AppInput
              label={t.savings.targetAmount}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={errors.targetAmount}
            />
            <AppInput
              label={`${t.savings.targetDate} (${t.common.optional})`}
              value={targetDate}
              onChangeText={(v) => { setTargetDate(v); if (errors.targetDate) setErrors((e) => ({ ...e, targetDate: "" })); }}
              placeholder="YYYY-MM-DD"
              error={errors.targetDate}
            />
          </>
        )}

        <AppButton title={t.common.save} onPress={handleSave} loading={loading} fullWidth size="lg" />
      </KeyboardAwareScrollViewCompat>

      <IconPicker selectedIcon={icon} onSelect={setIcon} visible={showIcon} onClose={() => setShowIcon(false)} />
      <ColorPicker selectedColor={color} onSelect={setColor} visible={showColor} onClose={() => setShowColor(false)} />
    </View>
  );
}
