import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/store/AppContext";
import * as Haptics from "expo-haptics";

type IconGroup = { label: string; icons: string[] };

const ICON_GROUPS: IconGroup[] = [
  {
    label: "الأسرة",
    icons: [
      "home-heart",
      "account-group",
      "human-male-female-child",
      "baby-face-outline",
      "human-child",
      "teddy-bear",
      "human-male-female",
      "heart-outline",
    ],
  },
  {
    label: "المال",
    icons: [
      "cash",
      "cash-multiple",
      "currency-usd",
      "wallet",
      "bank",
      "credit-card-outline",
      "coins",
      "cash-register",
    ],
  },
  {
    label: "الأعمال",
    icons: [
      "briefcase",
      "office-building",
      "handshake",
      "chart-bar",
      "laptop",
      "domain",
      "tie",
      "clipboard-text",
    ],
  },
  {
    label: "الادخار",
    icons: [
      "piggy-bank",
      "safe-square-outline",
      "bank-outline",
      "treasure-chest",
      "vault",
      "lock-outline",
      "gold",
      "bank-check",
    ],
  },
  {
    label: "الطعام",
    icons: [
      "food",
      "food-fork-drink",
      "coffee",
      "pizza",
      "hamburger",
      "noodles",
      "pot-steam",
      "cake",
    ],
  },
  {
    label: "السفر",
    icons: [
      "airplane",
      "map-marker",
      "earth",
      "compass",
      "beach",
      "hotel",
      "suitcase",
      "passport",
    ],
  },
  {
    label: "التسوق",
    icons: [
      "shopping",
      "cart",
      "bag-personal",
      "tag",
      "storefront-outline",
      "shopping-outline",
      "gift",
      "percent",
    ],
  },
  {
    label: "المجوهرات",
    icons: [
      "diamond-stone",
      "ring",
      "watch",
      "crown",
      "necklace",
      "earrings",
      "star-four-points",
      "shimmer",
    ],
  },
  {
    label: "السيارة",
    icons: [
      "car",
      "car-key",
      "steering",
      "car-wash",
      "car-cog",
      "car-side",
      "car-convertible",
      "car-electric",
    ],
  },
  {
    label: "الوقود",
    icons: [
      "gas-station",
      "fuel",
      "ev-station",
      "oil",
      "barrel",
      "pump",
      "lightning-bolt-circle",
      "fuel-cell",
    ],
  },
  {
    label: "الصيانة",
    icons: [
      "tools",
      "wrench",
      "hammer",
      "cog",
      "screwdriver",
      "home-wrench",
      "toolbox",
      "saw-blade",
    ],
  },
  {
    label: "الفواتير",
    icons: [
      "receipt",
      "file-document",
      "clipboard-list",
      "note-text",
      "format-list-checks",
      "file-sign",
      "invoice-text",
      "file-account",
    ],
  },
  {
    label: "الماء",
    icons: [
      "water",
      "water-pump",
      "shower-head",
      "water-outline",
      "waves",
      "water-polo",
      "swim",
      "pool",
    ],
  },
  {
    label: "الكهرباء",
    icons: [
      "lightning-bolt",
      "flash",
      "power-plug",
      "lightbulb",
      "electric-switch",
      "transmission-tower",
      "solar-power",
      "power",
    ],
  },
  {
    label: "المواصلات",
    icons: [
      "bus",
      "subway-variant",
      "taxi",
      "walk",
      "bike",
      "train",
      "ferry",
      "motorbike",
    ],
  },
  {
    label: "الاشتراكات",
    icons: [
      "repeat",
      "refresh",
      "calendar-sync",
      "rss",
      "star-circle",
      "autorenew",
      "update",
      "calendar-check",
    ],
  },
  {
    label: "الحوالات",
    icons: [
      "bank-transfer",
      "send",
      "arrow-right-circle",
      "swap-horizontal",
      "transfer",
      "arrow-left-right",
      "bank-transfer-in",
      "bank-transfer-out",
    ],
  },
  {
    label: "الاستثمار",
    icons: [
      "chart-line",
      "trending-up",
      "chart-areaspline",
      "finance",
      "gold",
      "chart-bell-curve-cumulative",
      "poll",
      "bitcoin",
    ],
  },
  {
    label: "أعمال خيرية",
    icons: [
      "hand-heart",
      "charity",
      "heart",
      "gift-outline",
      "hand-peace",
      "hands-pray",
      "mosque",
      "peace",
    ],
  },
  {
    label: "الألعاب",
    icons: [
      "gamepad-variant",
      "controller-classic",
      "chess-knight",
      "cards",
      "dice-multiple",
      "trophy",
      "medal",
      "puzzle",
    ],
  },
  {
    label: "الترفيه",
    icons: [
      "television-play",
      "movie-open",
      "theater",
      "music",
      "popcorn",
      "headphones",
      "ticket",
      "instagram",
    ],
  },
  {
    label: "السكن",
    icons: [
      "home",
      "home-city",
      "apartment",
      "floor-plan",
      "door-closed",
      "sofa",
      "bed",
      "lamp",
    ],
  },
  {
    label: "الزواج",
    icons: [
      "ring",
      "heart-circle",
      "diamond",
      "flower",
      "cake-variant",
      "human-male-female",
      "party-popper",
      "balloon",
    ],
  },
  {
    label: "الصحة",
    icons: [
      "hospital-box",
      "medical-bag",
      "pill",
      "needle",
      "stethoscope",
      "heart-pulse",
      "ambulance",
      "bandage",
      "tooth-outline",
      "eye-outline",
      "ear-hearing",
      "brain",
      "lungs",
      "bone",
      "blood-bag",
      "virus",
      "thermometer",
      "wheelchair-accessibility",
      "pharmacy",
      "hospital-building",
    ],
  },
  {
    label: "التعليم",
    icons: [
      "school",
      "book-open-variant",
      "pencil-ruler",
      "pen",
      "notebook",
      "library",
      "bookshelf",
      "graduation-cap",
      "certificate",
      "clipboard-text-outline",
      "calculator",
      "microscope",
      "atom",
      "flask",
      "test-tube",
      "ruler",
      "backpack",
      "desk",
      "account-school",
      "teach",
    ],
  },
  {
    label: "الرياضة",
    icons: [
      "dumbbell",
      "soccer",
      "run",
      "swim",
      "basketball",
      "tennis",
      "weightlifter",
      "yoga",
    ],
  },
  {
    label: "سوبرماركت",
    icons: [
      "store",
      "cart-variant",
      "fridge",
      "food-variant",
      "basket",
      "scale",
      "food-apple",
      "shopping-search",
    ],
  },
  {
    label: "عام",
    icons: [
      "star",
      "flag",
      "bookmark",
      "information",
      "check-circle",
      "plus-circle",
      "minus-circle",
      "alert-circle",
      "settings",
      "folder",
      "delete",
      "pencil",
      "lock",
      "lock-open",
      "eye",
      "share-variant",
      "download",
      "upload",
      "filter",
      "magnify",
      "bell",
      "clock",
      "calendar",
      "account",
      "map",
      "pin",
      "link",
      "leaf",
      "flower-outline",
      "emoticon-happy",
      "nature",
    ],
  },
];

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function IconPicker({ selectedIcon, onSelect, visible, onClose }: IconPickerProps) {
  const { theme, t, isRTL } = useApp();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return ICON_GROUPS;
    return ICON_GROUPS.map((g) => ({
      ...g,
      icons: g.icons.filter((ic) => ic.includes(search.toLowerCase().trim())),
    })).filter((g) => g.icons.length > 0);
  }, [search]);

  const handleSelect = (icon: string) => {
    Haptics.selectionAsync();
    onSelect(icon);
    onClose();
  };

  const COLS = 5;

  const groupedRows = useMemo(() => {
    const result: ({ type: "header"; label: string } | { type: "row"; icons: string[] })[] = [];
    for (const group of filteredGroups) {
      result.push({ type: "header", label: group.label });
      for (let i = 0; i < group.icons.length; i += COLS) {
        result.push({ type: "row", icons: group.icons.slice(i, i + COLS) });
      }
    }
    return result;
  }, [filteredGroups]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12,
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
            {t.common.icon}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Search */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 10,
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            backgroundColor: theme.cardSecondary,
            borderRadius: 10,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Feather name="search" size={16} color={theme.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="بحث..."
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, height: 38, color: theme.text, fontSize: 14 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={6}>
              <Feather name="x" size={14} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Icon grid with group headers */}
        <FlatList
          data={groupedRows}
          keyExtractor={(item, i) =>
            item.type === "header" ? `h-${item.label}` : `r-${i}`
          }
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: theme.textMuted,
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 6,
                    textAlign: isRTL ? "right" : "left",
                    letterSpacing: 0.5,
                  }}
                >
                  {item.label}
                </Text>
              );
            }
            return (
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  paddingHorizontal: 12,
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {item.icons.map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => handleSelect(icon)}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      maxWidth: 56,
                      borderRadius: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        selectedIcon === icon ? theme.primaryLight : theme.cardSecondary,
                      borderWidth: selectedIcon === icon ? 2 : 0,
                      borderColor: theme.primary,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={24}
                      color={selectedIcon === icon ? theme.primary : theme.textSecondary}
                    />
                  </Pressable>
                ))}
                {item.icons.length < COLS &&
                  Array.from({ length: COLS - item.icons.length }).map((_, k) => (
                    <View key={`gap-${k}`} style={{ flex: 1 }} />
                  ))}
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  container: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    maxHeight: "78%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
});
