import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Category } from "@/types";
import type { Theme } from "@/theme/colors";
import { getDisplayName } from "@/utils/display";

interface Props {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  theme: Theme;
  insets: { bottom: number };
  language: string;
  isRTL: boolean;
  noDataText: string;
  title: string;
}

export function CategoryPickerModal({
  visible,
  onClose,
  categories,
  selectedId,
  onSelect,
  theme,
  insets,
  language,
  isRTL,
  noDataText,
  title,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? categories.filter(
        (c) =>
          c.name_ar.includes(search) ||
          c.name_en.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const handleSelect = (id: string) => {
    setSearch("");
    onSelect(id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={handleClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "72%",
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              alignSelf: "center",
              marginBottom: 8,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
              {title}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Feather name="x" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Search */}
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 8,
              marginHorizontal: 12,
              marginTop: 10,
              marginBottom: 6,
              backgroundColor: theme.background,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: 12,
            }}
          >
            <Feather name="search" size={15} color={theme.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={language === "ar" ? "بحث..." : "Search..."}
              placeholderTextColor={theme.textMuted}
              style={{
                flex: 1,
                paddingVertical: 10,
                color: theme.text,
                fontSize: 14,
                textAlign: isRTL ? "right" : "left",
                ...Platform.select({ web: { outlineStyle: "none" } } as any),
              }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={6}>
                <Feather name="x" size={15} color={theme.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Grid */}
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            numColumns={3}
            keyboardShouldPersistTaps="handled"
            columnWrapperStyle={{ paddingHorizontal: 8, gap: 8, marginVertical: 4 }}
            contentContainerStyle={{ paddingVertical: 6 }}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 6,
                    backgroundColor: isSelected ? theme.primary + "18" : theme.background,
                    borderRadius: 14,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? theme.primary : theme.border,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      backgroundColor: `${item.color}22`,
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <CategoryIcon name={item.icon || "tag"} size={22} color={item.color} />
                    {item.is_favorite && (
                      <View
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          backgroundColor: "#F59E0B",
                          borderRadius: 6,
                          width: 12,
                          height: 12,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="star" size={7} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? theme.primary : theme.text,
                      textAlign: "center",
                      lineHeight: 14,
                    }}
                  >
                    {getDisplayName(item, language)}
                  </Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text
                style={{ color: theme.textMuted, textAlign: "center", padding: 20 }}
              >
                {noDataText}
              </Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
