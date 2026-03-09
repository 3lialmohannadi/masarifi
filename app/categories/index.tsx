import React, { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
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
    return categories.filter((c) => c.type === activeType);
  }, [categories, activeType]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {/* Header */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingTop: insets.top + 16, paddingBottom: 4 }}>
              <Pressable onPress={() => router.back()}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
              </Pressable>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.categories.title}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/(modals)/category-form?type=${activeType}`);
                }}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="plus" size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Type Filter Tabs */}
            <View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={CATEGORY_TYPE_TABS}
                keyExtractor={(tab) => tab}
                renderItem={({ item: tab }) => {
                  const isActive = activeType === tab;
                  return (
                    <Pressable
                      onPress={() => { Haptics.selectionAsync(); setActiveType(tab); }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isActive ? theme.primary : theme.card,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#fff" : theme.textSecondary }}>
                        {t.categories.types[tab]}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(modals)/category-form?id=${item.id}`)}
            style={({ pressed }) => ({
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: pressed ? theme.cardSecondary : theme.card,
              borderRadius: 14,
              padding: 14,
              marginTop: 8,
            })}
          >
            <View style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: item.color + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
                {getDisplayName(item, language)}
              </Text>
              {item.is_default && (
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  {language === "ar" ? "افتراضي" : "Default"}
                </Text>
              )}
            </View>
            {item.is_favorite && (
              <Feather name="star" size={16} color="#F59E0B" />
            )}
            {!item.is_default && (
              <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={theme.textMuted} />
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="tag"
            title={t.categories.noCategories}
            action={
              <Pressable
                onPress={() => router.push(`/(modals)/category-form?type=${activeType}`)}
                style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 }}
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
