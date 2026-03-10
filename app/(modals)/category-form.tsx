import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCategories } from "@/store/CategoriesContext";
import { AppButton } from "@/components/ui/AppButton";
import { BilingualNameInput } from "@/components/BilingualNameInput";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import type { CategoryType } from "@/types";

const CATEGORY_TYPES: CategoryType[] = ["income", "expense", "savings", "commitment", "plan"];

export default function CategoryFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, showToast } = useApp();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const params = useLocalSearchParams<{ id?: string; type?: CategoryType }>();

  const existing = params.id ? categories.find((c) => c.id === params.id) : undefined;
  const initialType = (params.type as CategoryType) || existing?.type || "expense";

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [catType, setCatType] = useState<CategoryType>(initialType);
  const [icon, setIcon] = useState(existing?.icon || "tag");
  const [color, setColor] = useState(existing?.color || "#2F8F83");
  const [isFavorite, setIsFavorite] = useState(existing?.is_favorite || false);
  const [showIcon, setShowIcon] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDefault = existing?.is_default ?? false;

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
          is_favorite: isFavorite,
        });
      } else {
        addCategory({
          name_ar: nameAr,
          name_en: nameEn,
          type: catType,
          icon,
          color,
          is_favorite: isFavorite,
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
    if (isDefault) {
      Alert.alert(t.categories.cannotDelete, t.categories.cannotDeleteDefault);
      return;
    }
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
        {existing && !isDefault ? (
          <Pressable onPress={handleDelete} hitSlop={8} testID="btn-delete-category">
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Default category info banner */}
        {isDefault && (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: theme.primaryLight,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: theme.primary + "40",
            }}
          >
            <Feather name="info" size={16} color={theme.primary} />
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                color: theme.primary,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {language === "ar"
                ? "يمكنك تخصيص الأيقونة واللون والاسم. لا يمكن حذف التصنيفات الافتراضية."
                : "You can customize the icon, color, and name. Default categories cannot be deleted."}
            </Text>
          </View>
        )}

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
            <Feather name={icon as any} size={32} color={color} />
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

        {/* Type selector — only for new categories */}
        {!existing && (
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: theme.textSecondary,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {t.common.type}
            </Text>
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {CATEGORY_TYPES.map((ct) => (
                <Pressable
                  key={ct}
                  onPress={() => setCatType(ct)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: catType === ct ? theme.primary : theme.card,
                    borderWidth: 1,
                    borderColor: catType === ct ? theme.primary : theme.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: catType === ct ? "#fff" : theme.text,
                    }}
                  >
                    {t.categories.types[ct]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* For existing: show type as read-only badge */}
        {existing && (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: theme.card,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>
              {t.common.type}
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                backgroundColor: theme.primary + "20",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: theme.primary }}>
                {t.categories.types[existing.type]}
              </Text>
            </View>
          </View>
        )}

        {/* Favorite Toggle */}
        <Pressable
          testID="btn-toggle-favorite"
          onPress={() => {
            Haptics.selectionAsync();
            setIsFavorite(!isFavorite);
          }}
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: theme.card,
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Feather
            name="star"
            size={20}
            color={isFavorite ? "#F59E0B" : theme.textSecondary}
          />
          <Text style={{ flex: 1, fontSize: 15, color: theme.text }}>
            {t.categories.favorite}
          </Text>
          <View
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              backgroundColor: isFavorite ? "#F59E0B" : theme.border,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 2,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#fff",
                alignSelf: isFavorite ? "flex-end" : "flex-start",
              }}
            />
          </View>
        </Pressable>

        <AppButton
          title={t.common.save}
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
        />
      </ScrollView>

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
