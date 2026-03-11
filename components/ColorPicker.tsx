import React from "react";
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import * as Haptics from "expo-haptics";

export const COLORS = [
  // Reds
  "#EF4444", "#DC2626", "#B91C1C", "#7F1D1D", "#F87171",
  // Oranges & Coral
  "#F97316", "#EA580C", "#C2410C", "#FF6B35", "#FB923C",
  // Yellows & Amber
  "#F59E0B", "#D97706", "#B45309", "#78350F", "#FCD34D",
  // Lime & Yellow-Green
  "#EAB308", "#CA8A04", "#A16207", "#84CC16", "#65A30D",
  // Greens
  "#22C55E", "#16A34A", "#15803D", "#166534", "#14532D",
  // Emerald & Teal
  "#10B981", "#059669", "#047857", "#065F46", "#064E3B",
  // Teal & Cyan
  "#14B8A6", "#0D9488", "#0F766E", "#134E4A", "#2F8F83",
  "#06B6D4", "#0891B2", "#0E7490", "#164E63",
  // Blues
  "#0EA5E9", "#0284C7", "#0369A1", "#1D4ED8", "#1E40AF",
  "#3B82F6", "#2563EB", "#1E3A5F", "#172554",
  // Indigo & Violet
  "#6366F1", "#4F46E5", "#4338CA", "#312E81", "#1E1B4B",
  "#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95",
  // Purple & Pink
  "#A855F7", "#9333EA", "#7E22CE", "#6B21A8",
  "#EC4899", "#DB2777", "#BE185D", "#9D174D",
  "#F43F5E", "#E11D48", "#BE123C", "#9F1239",
  // Rose & Blush
  "#FB7185", "#FDA4AF", "#FECDD3",
  // Browns & Earth
  "#92400E", "#6D3A2A", "#5C3317", "#795548", "#5D4037",
  // Slates & Grays
  "#64748B", "#475569", "#334155", "#1E293B", "#0F172A",
  "#6B7280", "#374151", "#111827", "#9CA3AF",
  // Warm Neutrals
  "#78716C", "#57534E", "#44403C", "#292524",
];

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function ColorPicker({ selectedColor, onSelect, visible, onClose }: ColorPickerProps) {
  const { theme, t } = useApp();

  const handleSelect = (color: string) => {
    Haptics.selectionAsync();
    onSelect(color);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: theme.text }}>
              {t.common.color}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.grid}>
            {COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => handleSelect(color)}
                style={[
                  styles.colorBtn,
                  { backgroundColor: color },
                  selectedColor === color && styles.selected,
                ]}
              >
                {selectedColor === color && (
                  <Feather name="check" size={18} color="#FFFFFF" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
    justifyContent: "center",
  },
  colorBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: "0 2px 6px rgba(0,0,0,0.30)" },
    }) as any,
  },
});
