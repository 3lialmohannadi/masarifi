import React from "react";
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import * as Haptics from "expo-haptics";

export const COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
  "#F43F5E", "#64748B", "#475569", "#334155", "#1E293B",
  "#7C3AED", "#DB2777", "#0284C7", "#059669", "#D97706",
  "#9333EA", "#E11D48", "#2563EB", "#16A34A", "#CA8A04",
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
