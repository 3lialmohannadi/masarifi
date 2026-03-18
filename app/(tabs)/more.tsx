import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { AppInput } from "@/components/ui/AppInput";

interface MenuItemProps {
  icon: string;
  label: string;
  color: string;
  subtitle?: string;
  onPress: () => void;
}

function MenuItem({ icon, label, color, subtitle, onPress }: MenuItemProps) {
  const { theme, isRTL } = useApp();
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => ({
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 13,
        paddingHorizontal: 16,
        backgroundColor: pressed ? theme.cardSecondary : theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color + "15", alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left", marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={15} color={theme.textMuted} />
      </View>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { theme, isRTL } = useApp();
  return (
    <View style={{
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 4,
      marginBottom: 10,
      marginTop: 6,
    }}>
      <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: theme.primary }} />
      <Text style={{ fontSize: 10, fontWeight: "500", color: theme.textMuted }}>
        {title}
      </Text>
    </View>
  );
}

function SectionSeparator() {
  const { theme } = useApp();
  return (
    <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 16, marginHorizontal: 4, opacity: 0.5 }} />
  );
}

export default function MoreTab() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, settings, updateSettings } = useApp();
  const [manualDailyLimit, setManualDailyLimit] = useState(
    String(settings.manual_daily_limit || "")
  );

  const saveManualLimit = useCallback(() => {
    const val = parseFloat(manualDailyLimit);
    if (!isNaN(val) && val >= 0) updateSettings({ manual_daily_limit: val });
  }, [manualDailyLimit, updateSettings]);

  const LIMIT_MODES = [
    { key: "smart" as const, label: t.settings.smartLimit, desc: t.settings.smartLimitDesc, icon: "zap" },
    { key: "manual" as const, label: t.settings.manualLimit, desc: t.settings.manualLimitDesc, icon: "sliders" },
  ];

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left", marginBottom: 24 }}>
          {t.tabs.more}
        </Text>

        {/* ── Financial Management section ── */}
        <SectionHeader title={t.more.financial} />
        <View style={{ gap: 8 }}>
          <MenuItem
            icon="credit-card"
            label={t.debts.title}
            subtitle={t.more.debtsSubtitle}
            color="#EF4444"
            onPress={() => router.push("/debts")}
          />
          <MenuItem
            icon="calendar"
            label={t.commitments.title}
            subtitle={t.more.commitmentsSubtitle}
            color="#F59E0B"
            onPress={() => router.push("/commitments")}
          />
          <MenuItem
            icon="shuffle"
            label={t.transfer.title}
            subtitle={t.more.transferSubtitle}
            color="#06B6D4"
            onPress={() => router.push("/(modals)/transfer-form")}
          />
        </View>

        <SectionSeparator />

        {/* ── Accounts section ── */}
        <SectionHeader title={t.more.accounts} />
        <View style={{ gap: 8 }}>
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
            icon="bar-chart-2"
            label={t.tabs.statistics}
            subtitle={t.more.statisticsSubtitle}
            color="#8B5CF6"
            onPress={() => router.push("/(tabs)/statistics")}
          />
          <MenuItem
            icon="file-text"
            label={t.statistics.monthlyReport}
            subtitle={t.more.monthlyReportSubtitle}
            color={theme.primary}
            onPress={() => router.push("/report")}
          />
        </View>

        <SectionSeparator />

        {/* ── Daily Limit Mode ── */}
        <SectionHeader title={t.settings.dailyLimitMode} />
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 12,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.primary + "18", alignItems: "center", justifyContent: "center" }}>
              <Feather name="sliders" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                {t.settings.dailyLimitMode}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                {settings.daily_limit_mode === "smart" ? t.settings.smartLimitDesc : t.settings.manualLimitDesc}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
            {LIMIT_MODES.map((opt) => {
              const active = settings.daily_limit_mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  testID={`limit-${opt.key}`}
                  onPress={() => { Haptics.selectionAsync(); updateSettings({ daily_limit_mode: opt.key }); }}
                  style={{
                    flex: 1,
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 8,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: active ? theme.primaryLight : theme.background,
                    borderWidth: 1.5,
                    borderColor: active ? theme.primary : theme.border,
                  }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: active ? theme.primary + "25" : theme.border + "50", alignItems: "center", justifyContent: "center" }}>
                    <Feather name={opt.icon as any} size={16} color={active ? theme.primary : theme.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>{opt.label}</Text>
                  </View>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    borderWidth: 2,
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: active ? theme.primary : "transparent",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {settings.daily_limit_mode === "manual" && (
            <View style={{ paddingTop: 2 }}>
              <AppInput
                testID="manual-limit-input"
                label={t.settings.manualLimitAmount}
                value={manualDailyLimit}
                onChangeText={(v) => setManualDailyLimit(v)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                onEndEditing={saveManualLimit}
                onBlur={saveManualLimit}
              />
              {manualDailyLimit !== "" && !isNaN(parseFloat(manualDailyLimit)) && (
                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: isRTL ? "right" : "left", paddingHorizontal: 4, marginTop: 4 }}>
                  {t.settings.autoSave}
                </Text>
              )}
            </View>
          )}
        </View>

        <SectionSeparator />

        {/* ── App settings ── */}
        <SectionHeader title={t.more.settings} />
        <View style={{ gap: 8 }}>
          <MenuItem
            icon="settings"
            label={t.settings.title}
            subtitle={t.more.settingsSubtitle}
            color="#6B7280"
            onPress={() => router.push("/settings")}
          />
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}
