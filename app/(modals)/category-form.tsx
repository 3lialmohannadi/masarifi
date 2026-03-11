import React, { useState } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCategories } from "@/store/CategoriesContext";
import { AppButton } from "@/components/ui/AppButton";
import { BilingualNameInput } from "@/components/BilingualNameInput";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function CategoryFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, showToast } = useApp();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? categories.find((c) => c.id === params.id) : undefined;

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [icon, setIcon] = useState(existing?.icon || "tag");
  const [color, setColor] = useState(existing?.color || "#2F8F83");
  const [showIcon, setShowIcon] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const err: Record<string, string> = {};
    if (!nameAr.trim() && !nameEn.trim()) err.name = t.validation.nameRequired;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (existing) {
        updateCategory(existing.id, {
          name_ar: nameAr,
          name_en: nameEn,
          icon,
          color,
        });
      } else {
        addCategory({
          name_ar: nameAr,
          name_en: nameEn,
          type: "general",
          icon,
          color,
          is_favorite: false,
          is_default: false,
          is_active: true,
        });
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
    if (!existing) return;
    Alert.alert(t.common.areYouSure, t.categories.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          const success = deleteCategory(existing.id);
          if (!success) {
            Alert.alert(t.categories.cannotDelete, t.categories.cannotDeleteInUse);
            return;
          }
          showToast(t.toast.deleted, "info");
          router.back();
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? insets.top + 51 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: topPad + 16,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {existing ? t.categories.edit : t.categories.add}
        </Text>
        {existing ? (
          <Pressable onPress={handleDelete} hitSlop={8} testID="btn-delete-category">
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 30,
        }}
        showsVerticalScrollIndicator={false}
        bottomOffset={60}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon & Color Row */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12 }}>
          <Pressable
            testID="btn-pick-icon"
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
            <CategoryIcon name={icon} size={32} color={color} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{t.common.icon}</Text>
          </Pressable>
          <Pressable
            testID="btn-pick-color"
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

        {/* Bilingual name */}
        <BilingualNameInput
          nameAr={nameAr}
          nameEn={nameEn}
          onChangeAr={setNameAr}
          onChangeEn={setNameEn}
          errorAr={errors.name}
        />

        <AppButton
          title={t.common.save}
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
        />
      </KeyboardAwareScrollViewCompat>

      <IconPicker
        selectedIcon={icon}
        onSelect={setIcon}
        visible={showIcon}
        onClose={() => setShowIcon(false)}
      />
      <ColorPicker
        selectedColor={color}
        onSelect={setColor}
        visible={showColor}
        onClose={() => setShowColor(false)}
      />
    </View>
  );
}
