import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";
import { getProfile, type Profile } from "@/src/lib/profileService";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
}) {
  const { theme, isRTL } = useApp();
  if (!value) return null;
  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: theme.primary + "15",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon as any} size={16} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            color: theme.textMuted,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            fontWeight: "500",
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, isDark } = useApp();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/(tabs)");
      return;
    }
    getProfile(user.id)
      .then((p) => setProfile(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0] ?? "?").toUpperCase();

  const memberSince = (profile?.created_at ?? user?.created_at)
    ? new Date(profile?.created_at ?? user!.created_at).toLocaleDateString(
        "en-GB",
        { year: "numeric", month: "long" }
      )
    : null;

  const cardShadow =
    Platform.OS !== "web" && !isDark
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }
      : {};

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          paddingTop: topPadding,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: theme.background,
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
          <Feather
            name={isRTL ? "chevron-right" : "chevron-left"}
            size={18}
            color={theme.text}
          />
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
          {t.auth.viewProfile}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
            ...cardShadow,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}
            >
              {initials}
            </Text>
          </View>
          {profile?.full_name ? (
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: theme.text,
                textAlign: "center",
              }}
            >
              {profile.full_name}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: "center",
            }}
          >
            {user?.email}
          </Text>
          {memberSince ? (
            <View
              style={{
                backgroundColor: theme.primary + "15",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: theme.primary,
                  fontWeight: "600",
                }}
              >
                {t.auth.memberSince} {memberSince}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: theme.border,
            ...cardShadow,
          }}
        >
          <InfoRow
            icon="user"
            label={t.auth.profileName}
            value={profile?.full_name}
          />
          <InfoRow
            icon="mail"
            label={t.auth.email}
            value={user?.email}
          />
          <InfoRow
            icon="phone"
            label={t.auth.profilePhone}
            value={profile?.phone}
          />
          <InfoRow
            icon="users"
            label={t.auth.profileGender}
            value={profile?.gender}
          />
        </View>
      </ScrollView>
    </View>
  );
}
