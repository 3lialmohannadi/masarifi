import React from "react";
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import * as Haptics from "expo-haptics";

const ICONS = [
  "home", "briefcase", "credit-card", "dollar-sign", "trending-up", "trending-down",
  "shopping-cart", "shopping-bag", "coffee", "truck", "zap", "heart", "book", "film",
  "music", "gift", "star", "target", "globe", "map-pin", "phone", "wifi", "shield",
  "tool", "scissors", "camera", "image", "clock", "calendar", "flag", "tag", "box",
  "archive", "file-text", "folder", "printer", "monitor", "cpu", "battery", "bluetooth",
  "search", "settings", "user", "users", "activity", "award", "anchor", "bar-chart-2",
  "pie-chart", "layers", "package", "repeat", "refresh-cw", "plus-circle", "minus-circle",
  "more-horizontal", "feather", "sun", "moon", "cloud", "umbrella", "wind", "droplet",
];

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function IconPicker({ selectedIcon, onSelect, visible, onClose }: IconPickerProps) {
  const { theme, t } = useApp();

  const handleSelect = (icon: string) => {
    Haptics.selectionAsync();
    onSelect(icon);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: theme.text }}>
              {t.common.icon}
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.grid}>
            {ICONS.map((icon) => (
              <Pressable
                key={icon}
                onPress={() => handleSelect(icon)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor:
                      selectedIcon === icon ? theme.primaryLight : theme.cardSecondary,
                    borderWidth: selectedIcon === icon ? 2 : 0,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Feather
                  name={icon as any}
                  size={22}
                  color={selectedIcon === icon ? theme.primary : theme.textSecondary}
                />
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
    maxHeight: "75%",
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
    gap: 10,
    justifyContent: "center",
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
