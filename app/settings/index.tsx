import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { AppInput } from "@/components/ui/AppInput";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, setLanguage, colorScheme, setColorScheme, settings, updateSettings, isRTL } = useApp();

  const [manualDailyLimit, setManualDailyLimit] = useState(String(settings.manual_daily_limit));

  const LANG_OPTIONS = [
    { code: "ar" as const, label: "العربية", native: true },
    { code: "en" as const, label: "English", native: true },
  ];

  const THEME_OPTIONS = [
    { key: "light" as const, label: t.settings.light, icon: "sun" },
    { key: "dark" as const, label: t.settings.dark, icon: "moon" },
    { key: "auto" as const, label: t.settings.auto, icon: "smartphone" },
  ];

  const LIMIT_MODES = [
    { key: "smart" as const, label: t.settings.smartLimit, desc: t.settings.smartLimitDesc },
    { key: "manual" as const, label: t.settings.manualLimit, desc: t.settings.manualLimitDesc },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={24} color={theme.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {t.settings.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.settings.language}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {LANG_OPTIONS.map((opt) => (
              <Pressable
                key={opt.code}
                onPress={() => {
                  Haptics.selectionAsync();
                  setLanguage(opt.code);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: language === opt.code ? theme.primary : theme.card,
                  borderWidth: 2,
                  borderColor: language === opt.code ? theme.primary : theme.border,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "700" }}>
                  {opt.code === "ar" ? "🇶🇦" : "🇬🇧"}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: language === opt.code ? "#fff" : theme.text, marginTop: 4 }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Theme */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.settings.theme}
          </Text>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setColorScheme(opt.key);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: colorScheme === opt.key ? theme.primary : theme.card,
                  borderWidth: 2,
                  borderColor: colorScheme === opt.key ? theme.primary : theme.border,
                }}
              >
                <Feather name={opt.icon as any} size={20} color={colorScheme === opt.key ? "#fff" : theme.textSecondary} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colorScheme === opt.key ? "#fff" : theme.text }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Daily Limit Mode */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.settings.dailyLimitMode}
          </Text>
          {LIMIT_MODES.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => {
                Haptics.selectionAsync();
                updateSettings({ daily_limit_mode: opt.key });
              }}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 14,
                padding: 16,
                borderRadius: 14,
                backgroundColor: settings.daily_limit_mode === opt.key ? theme.primaryLight : theme.card,
                borderWidth: 2,
                borderColor: settings.daily_limit_mode === opt.key ? theme.primary : theme.border,
              }}
            >
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: settings.daily_limit_mode === opt.key ? theme.primary : theme.border,
                backgroundColor: settings.daily_limit_mode === opt.key ? theme.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {settings.daily_limit_mode === opt.key && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>{opt.label}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{opt.desc}</Text>
              </View>
            </Pressable>
          ))}

          {settings.daily_limit_mode === "manual" && (
            <AppInput
              label={t.settings.manualLimitAmount}
              value={manualDailyLimit}
              onChangeText={setManualDailyLimit}
              keyboardType="decimal-pad"
              placeholder="0.00"
              onEndEditing={() => {
                const val = parseFloat(manualDailyLimit);
                if (!isNaN(val)) updateSettings({ manual_daily_limit: val });
              }}
            />
          )}
        </View>

        {/* Notifications Toggle */}
        <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <Feather name="bell" size={20} color={theme.textSecondary} />
            <View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>{t.settings.notifications}</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.settings.notificationsDesc}</Text>
            </View>
          </View>
          <Switch
            value={settings.notification_enabled}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              updateSettings({ notification_enabled: v });
            }}
            trackColor={{ true: theme.primary, false: theme.border }}
          />
        </View>

        {/* App Info */}
        <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, gap: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.primary }}>مصاريفي</Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>Masarifi</Text>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
