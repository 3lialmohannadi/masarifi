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
  color: string;
  subtitle?: string;
  onPress: () => void;
}

function MenuItem({ icon, label, color, subtitle, onPress }: MenuItemProps) {
  const { theme, isRTL, isDark } = useApp();
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => ({
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        borderRadius: 16,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: theme.border,
        ...(isDark ? {} : Platform.OS === "web"
          ? { boxShadow: "0 2px 8px rgba(47,143,131,0.08)" }
          : { shadowColor: "#2F8F83", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }),
      })}
    >
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: color + "18", alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={theme.textMuted} />
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { theme, isRTL } = useApp();
  return (
    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4, marginBottom: 8, marginTop: 4, textAlign: isRTL ? "right" : "left" }}>
      {title}
    </Text>
  );
}

export default function MoreTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL } = useApp();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110),
          gap: 4,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 20 }}>
          {t.tabs.more}
        </Text>

        <SectionHeader title={t.more.financial} />
        <MenuItem
          icon="calendar"
          label={t.commitments.title}
          subtitle={t.more.commitmentsSubtitle}
          color="#F59E0B"
          onPress={() => router.push("/commitments")}
        />

        <View style={{ height: 12 }} />
        <SectionHeader title={t.more.accounts} />
        <MenuItem
          icon="credit-card"
          label={t.accounts.title}
          subtitle={t.more.accountsSubtitle}
          color={theme.primary}
          onPress={() => router.push("/accounts/list")}
        />
        <MenuItem
          icon="tag"
          label={t.categories.title}
          subtitle={t.more.categoriesSubtitle}
          color="#EC4899"
          onPress={() => router.push("/categories")}
        />
        <MenuItem
          icon="shuffle"
          label={t.transfer.title}
          subtitle={t.more.transferSubtitle}
          color="#06B6D4"
          onPress={() => router.push("/(modals)/transfer-form")}
        />

        <View style={{ height: 12 }} />
        <SectionHeader title={t.more.settings} />
        <MenuItem
          icon="settings"
          label={t.settings.title}
          subtitle={t.more.settingsSubtitle}
          color="#6B7280"
          onPress={() => router.push("/settings")}
        />

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}
