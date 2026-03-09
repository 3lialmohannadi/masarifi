import React from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";

interface MenuItemProps {
  icon: string;
  label: string;
  color?: string;
  onPress: () => void;
  badge?: string;
}

function MenuItem({ icon, label, color, onPress, badge }: MenuItemProps) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        borderRadius: 14,
        marginBottom: 6,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: color ? `${color}20` : theme.cardSecondary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon as any} size={20} color={color || theme.textSecondary} />
      </View>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: "500", color: theme.text }}>
        {label}
      </Text>
      {badge && (
        <View
          style={{
            backgroundColor: theme.primary,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={16} color={theme.textMuted} />
    </Pressable>
  );
}

export default function MoreTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, language } = useApp();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {t.tabs.more}
        </Text>

        {/* Financial Management */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, paddingHorizontal: 4, marginBottom: 6, textAlign: isRTL ? "right" : "left" }}>
            {language === "ar" ? "الإدارة المالية" : "Financial Management"}
          </Text>
          <MenuItem
            icon="calendar"
            label={t.commitments.title}
            color={theme.commitment}
            onPress={() => router.push("/commitments/index")}
          />
          <MenuItem
            icon="pie-chart"
            label={t.budget.title}
            color="#F59E0B"
            onPress={() => router.push("/budget/index")}
          />
          <MenuItem
            icon="bar-chart-2"
            label={t.statistics.title}
            color={theme.savings}
            onPress={() => router.push("/statistics/index")}
          />
        </View>

        {/* Account Management */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, paddingHorizontal: 4, marginBottom: 6, textAlign: isRTL ? "right" : "left" }}>
            {language === "ar" ? "إدارة الحسابات" : "Account Management"}
          </Text>
          <MenuItem
            icon="credit-card"
            label={t.accounts.title}
            color={theme.primary}
            onPress={() => router.push("/accounts/list")}
          />
          <MenuItem
            icon="tag"
            label={t.categories.title}
            color="#8B5CF6"
            onPress={() => router.push("/categories/index")}
          />
          <MenuItem
            icon="shuffle"
            label={t.transfer.title}
            color={theme.transfer}
            onPress={() => router.push("/(modals)/transfer-form")}
          />
        </View>

        {/* Settings */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, paddingHorizontal: 4, marginBottom: 6, textAlign: isRTL ? "right" : "left" }}>
            {language === "ar" ? "الإعدادات" : "Settings"}
          </Text>
          <MenuItem
            icon="settings"
            label={t.settings.title}
            color={theme.textSecondary}
            onPress={() => router.push("/settings/index")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

