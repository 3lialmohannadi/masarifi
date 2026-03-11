import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL, isDark } = useApp();
  const { categories, deleteCategory } = useCategories();

  const activeCategories = useMemo(
    () => [...categories],
    [categories]
  );

  const paddedData = useMemo(() => {
    const remainder = activeCategories.length % 3;
    if (remainder === 0) return activeCategories as (typeof activeCategories[0] | null)[];
    return [...activeCategories, ...Array(3 - remainder).fill(null)] as (typeof activeCategories[0] | null)[];
  }, [activeCategories]);

  const cardShadow = isDark ? {} : Platform.OS === "web"
    ? { boxShadow: "0 2px 8px rgba(47,143,131,0.07)" }
    : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 };

  const handleDelete = (item: typeof activeCategories[0]) => {
    Alert.alert(t.common.areYouSure, t.categories.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          const success = deleteCategory(item.id);
          if (!success) {
            Alert.alert(t.categories.cannotDelete, t.categories.cannotDeleteInUse);
          }
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? insets.top + 51 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={paddedData}
        keyExtractor={(item, index) => item?.id ?? `spacer-${index}`}
        numColumns={3}
        columnWrapperStyle={{ gap: 8, marginTop: 8 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 30,
        }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                paddingTop: topPad + 16,
                paddingBottom: 8,
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
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  fontSize: 22,
                  fontWeight: "800",
                  color: theme.text,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {t.categories.title}
              </Text>
              <Pressable
                testID="btn-add-category"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/(modals)/category-form`);
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="plus" size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Count badge */}
            {activeCategories.length > 0 && (
              <View style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 6,
              }}>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  backgroundColor: theme.primaryLight,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: theme.primary }}>
                    {activeCategories.length} {language === "ar" ? "تصنيف" : "categories"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (!item) {
            return <View style={{ flex: 1 }} />;
          }
          return (
            <View
              style={{
                flex: 1,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: "hidden",
                backgroundColor: theme.card,
                ...cardShadow,
              }}
            >
              {/* Content area */}
              <View
                style={{
                  paddingTop: 14,
                  paddingBottom: 10,
                  paddingHorizontal: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  minHeight: 88,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: item.color + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CategoryIcon name={item.icon} size={21} color={item.color} />
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: theme.text,
                    textAlign: "center",
                    lineHeight: 15,
                    paddingHorizontal: 2,
                  }}
                >
                  {getDisplayName(item, language)}
                </Text>
              </View>

              {/* Action row */}
              <View
                style={{
                  flexDirection: "row",
                  borderTopWidth: 1,
                  borderColor: theme.border,
                }}
              >
                {/* Edit button */}
                <Pressable
                  testID={`category-item-${item.id}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/(modals)/category-form?id=${item.id}`);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 7,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? theme.cardSecondary : "transparent",
                    borderRightWidth: 1,
                    borderColor: theme.border,
                  })}
                >
                  <Feather name="edit-2" size={12} color={theme.primary} />
                </Pressable>

                {/* Delete button */}
                <Pressable
                  testID={`btn-delete-category-${item.id}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleDelete(item);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 7,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? theme.expenseBackground : "transparent",
                  })}
                >
                  <Feather name="trash-2" size={12} color={theme.expense} />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ gridColumn: "1 / -1" } as any}>
            <EmptyState
              icon="tag"
              title={t.categories.noCategories}
              subtitle={t.categories.addFirstCategory}
              action={
                <Pressable
                  onPress={() => router.push(`/(modals)/category-form`)}
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>{t.categories.add}</Text>
                </Pressable>
              }
            />
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
