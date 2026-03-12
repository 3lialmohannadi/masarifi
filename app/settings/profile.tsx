import React, { useEffect } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const { theme, isRTL } = useApp();
  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        padding: 14,
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          backgroundColor: theme.primaryLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon as any} size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            color: theme.textMuted,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: theme.text,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, language } = useApp();
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile().catch(() => {});
  }, []);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const genderLabel = user?.gender
    ? user.gender === "male"
      ? t.profile.male
      : t.profile.female
    : "—";

  const authProviderLabel = user?.auth_provider === "google" ? "Google" : t.auth.email;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(language === "ar" ? "ar-QA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          paddingTop: topPadding,
          paddingBottom: 12,
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 22,
            fontWeight: "800",
            color: theme.text,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t.profile.title}
        </Text>
        <Pressable
          onPress={() => router.push("/settings/edit-profile")}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.primaryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="edit-2" size={16} color={theme.primary} />
        </Pressable>
      </View>

      <View style={{ padding: 20, gap: 10, paddingBottom: insets.bottom + 40 }}>
        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: "700", color: "#fff" }}>
              {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text }}>
            {user?.full_name || "—"}
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            {user?.email || "—"}
          </Text>
        </View>

        {/* Info Rows */}
        <InfoRow icon="user" label={t.profile.fullName} value={user?.full_name || ""} />
        <InfoRow icon="mail" label={t.profile.email} value={user?.email || ""} />
        <InfoRow icon="phone" label={t.profile.phone} value={user?.phone || ""} />
        <InfoRow icon="users" label={t.profile.gender} value={genderLabel} />
        <InfoRow icon="shield" label={t.profile.loginMethod} value={authProviderLabel} />
        <InfoRow icon="calendar" label={t.profile.memberSince} value={memberSince} />
      </View>
    </View>
  );
}
