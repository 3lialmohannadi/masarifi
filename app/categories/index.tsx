import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CategoryType } from "@/types";

const CATEGORY_TYPE_TABS: CategoryType[] = ["expense", "income", "savings", "commitment", "plan"];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { categories } = useCategories();
  const [activeType, setActiveType] = useState<CategoryType>("expense");

  const filtered = useMemo(() => {
    return categories.filter((c) => c.type === activeType && c.is_active);
  }, [categories, activeType]);

  const countByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of categories) {
      if (c.is_active) map[c.type] = (map[c.type] || 0) + 1;
    }
    return map;
  }, [categories]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 30 }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                paddingTop: topPad + 16,
                paddingBottom: 4,
              }}
            >
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: "700",
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
                  router.push(`/(modals)/category-form?type=${activeType}`);
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

            {/* Type Filter Tabs with counts */}
            <View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={CATEGORY_TYPE_TABS}
                keyExtractor={(tab) => tab}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item: tab }) => {
                  const isActive = activeType === tab;
                  const count = countByType[tab] || 0;
                  return (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveType(tab);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isActive ? theme.primary : theme.card,
                        borderWidth: 1,
                        borderColor: isActive ? theme.primary : theme.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: isActive ? "#fff" : theme.textSecondary,
                        }}
                      >
                        {t.categories.types[tab]}
                      </Text>
                      {count > 0 && (
                        <View
                          style={{
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: isActive ? "rgba(255,255,255,0.25)" : theme.cardSecondary,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: isActive ? "#fff" : theme.textSecondary,
                            }}
                          >
                            {count}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`category-item-${item.id}`}
            onPress={() => router.push(`/(modals)/category-form?id=${item.id}`)}
            style={({ pressed }) => ({
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: pressed ? theme.cardSecondary : theme.card,
              borderRadius: 14,
              padding: 14,
              marginTop: 8,
              borderWidth: 1,
              borderColor: theme.border,
            })}
          >
            {/* Icon */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: item.color + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name={item.icon as any} size={20} color={item.color} />
            </View>

            {/* Name + meta */}
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: theme.text,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {getDisplayName(item, language)}
              </Text>
              {item.is_default && (
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 4,
                    alignSelf: isRTL ? "flex-end" : "flex-start",
                  }}
                >
                  <Feather name="lock" size={10} color={theme.textMuted} />
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>
                    {language === "ar" ? "افتراضي" : "Default"}
                  </Text>
                </View>
              )}
            </View>

            {/* Favorite star */}
            {item.is_favorite && (
              <Feather name="star" size={15} color="#F59E0B" />
            )}

            {/* Chevron for all categories */}
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={16}
              color={theme.textMuted}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => null}
        ListEmptyComponent={
          <EmptyState
            icon="tag"
            title={t.categories.noCategories}
            action={
              <Pressable
                onPress={() => router.push(`/(modals)/category-form?type=${activeType}`)}
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
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
