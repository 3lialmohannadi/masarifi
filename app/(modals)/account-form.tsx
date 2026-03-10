import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { BilingualNameInput } from "@/components/BilingualNameInput";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import { CURRENCIES } from "@/utils/currency";
import type { AccountType } from "@/types";

export default function AccountFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? accounts.find((a) => a.id === params.id) : undefined;

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [type, setType] = useState<AccountType>(existing?.type || "current");
  const [balance, setBalance] = useState(existing ? String(existing.balance) : "0");
  const [currency, setCurrency] = useState(existing?.currency || "QAR");
  const [color, setColor] = useState(existing?.color || "#2F8F83");
  const [icon, setIcon] = useState(existing?.icon || "credit-card");
  const [showIcon, setShowIcon] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ACCOUNT_TYPES: AccountType[] = ["current", "cash", "travel", "savings_bank", "wallet", "credit", "investment"];

  const validate = () => {
    const err: Record<string, string> = {};
    if (!nameAr.trim() && !nameEn.trim()) err.name = t.validation.nameRequired;
    if (!currency) err.currency = t.validation.currencyRequired;
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
        type,
        balance: parseFloat(balance) || 0,
        currency,
        color,
        icon,
        is_active: existing ? existing.is_active : true,
      };
      if (existing) {
        updateAccount(existing.id, data);
      } else {
        addAccount(data);
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = () => {
    Alert.alert(t.common.areYouSure, t.accounts.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.accounts.delete,
        style: "destructive",
        onPress: () => {
          if (existing) deleteAccount(existing.id);
          router.back();
        },
      },
    ]);
  };

  const handleRestore = () => {
    if (existing) {
      updateAccount(existing.id, { is_active: true });
      router.back();
    }
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
          {existing ? t.accounts.edit : t.accounts.add}
        </Text>
        {existing ? (
          existing.is_active ? (
            <Pressable onPress={handleArchive}>
              <Feather name="archive" size={20} color={theme.expense} />
            </Pressable>
          ) : (
            <Pressable onPress={handleRestore}>
              <Feather name="refresh-cw" size={20} color={theme.primary} />
            </Pressable>
          )
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 30 }}>
        {/* Icon & Color Row */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
          <Pressable
            onPress={() => setShowIcon(true)}
            style={{
              flex: 1,
              backgroundColor: color + "20",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              gap: 8,
              borderWidth: 2,
              borderColor: color,
            }}
          >
            <Feather name={icon as any} size={32} color={color} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t.common.icon}</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowColor(true)}
            style={{
              flex: 1,
              backgroundColor: color,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Feather name="droplet" size={28} color="#fff" />
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{t.common.color}</Text>
          </Pressable>
        </View>

        {/* Bilingual Name */}
        <BilingualNameInput
          nameAr={nameAr}
          nameEn={nameEn}
          onChangeAr={setNameAr}
          onChangeEn={setNameEn}
          errorAr={errors.name}
        />

        {/* Account Type */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.type}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {ACCOUNT_TYPES.map((aType) => (
                <Pressable
                  key={aType}
                  onPress={() => setType(aType)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: type === aType ? theme.primary : theme.card,
                    borderWidth: 1,
                    borderColor: type === aType ? theme.primary : theme.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: type === aType ? "#fff" : theme.text }}>
                    {t.accounts.types[aType]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Balance */}
        <AppInput
          label={existing ? t.accounts.balance : t.accounts.openingBalance}
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        {/* Currency */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.currency}
          </Text>
          <Pressable
            onPress={() => setShowCurrency(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.currency ? "#EF4444" : theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: currency ? theme.text : theme.textMuted, fontSize: 15, fontWeight: "600" }}>
              {currency || t.validation.currencyRequired}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {currency && (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {CURRENCIES.find((c) => c.code === currency)?.symbol}
                </Text>
              )}
              <Feather name="chevron-down" size={16} color={theme.textMuted} />
            </View>
          </Pressable>
          {errors.currency && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.currency}</Text>}
        </View>

        <AppButton title={t.common.save} onPress={handleSave} loading={loading} fullWidth size="lg" />
      </ScrollView>

      <IconPicker selectedIcon={icon} onSelect={setIcon} visible={showIcon} onClose={() => setShowIcon(false)} />
      <ColorPicker selectedColor={color} onSelect={setColor} visible={showColor} onClose={() => setShowColor(false)} />

      {/* Currency Picker */}
      <Modal visible={showCurrency} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.common.currency}</Text>
              <Pressable onPress={() => setShowCurrency(false)}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setCurrency(item.code); setShowCurrency(false); }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    backgroundColor: currency === item.code ? theme.primaryLight : "transparent",
                    marginHorizontal: 8,
                    borderRadius: 12,
                    marginVertical: 2,
                  }}
                >
                  <Text style={{ width: 50, fontSize: 20, fontWeight: "700", color: theme.primary }}>{item.symbol}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>{item.code}</Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                      {language === "ar" ? item.nameAr : item.nameEn}
                    </Text>
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
