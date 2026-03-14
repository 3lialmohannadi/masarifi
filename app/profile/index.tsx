import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";
import { getProfile, updateProfile, type Profile } from "@/src/lib/profileService";

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

function EditRow({
  icon,
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  const { theme, isRTL } = useApp();
  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: theme.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon as any} size={16} color={theme.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
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
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType || "default"}
          textAlign={isRTL ? "right" : "left"}
          style={{
            fontSize: 15,
            color: theme.text,
            fontWeight: "500",
            paddingVertical: 4,
            paddingHorizontal: 8,
            backgroundColor: theme.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.primary + "40",
          }}
        />
      </View>
    </View>
  );
}

const GENDER_OPTIONS = ["male", "female", "other"] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, isDark } = useApp();
  const { user, isAuthLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("");

  const handleSignOut = () => {
    Alert.alert(
      t.auth.signOut,
      t.auth.signOutConfirm,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.auth.signOut,
          style: "destructive",
          onPress: async () => {
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/(tabs)");
      return;
    }
    getProfile(user.id)
      .then((p) => {
        setProfile(p);
        setEditName(p?.full_name || "");
        setEditPhone(p?.phone || "");
        setEditGender(p?.gender || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isAuthLoading]);

  const startEditing = () => {
    setEditName(profile?.full_name || "");
    setEditPhone(profile?.phone || "");
    setEditGender(profile?.gender || "");
    setIsEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEdits = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, {
        full_name: editName.trim() || null,
        phone: editPhone.trim() || null,
        gender: editGender || null,
      });
      if (updated) {
        setProfile(updated);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setIsEditing(false);
    } catch {
      Alert.alert(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const genderLabel = (g: string | null | undefined) => {
    if (!g) return null;
    if (g === "male") return t.auth.genderMale;
    if (g === "female") return t.auth.genderFemale;
    return t.auth.genderOther;
  };

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
          onPress={isEditing ? cancelEditing : () => router.back()}
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
            name={isEditing ? "x" : isRTL ? "chevron-right" : "chevron-left"}
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
          {isEditing ? t.auth.editProfile : t.auth.viewProfile}
        </Text>
        {!isEditing ? (
          <Pressable
            onPress={startEditing}
            hitSlop={8}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: theme.primary + "18",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Feather name="edit-2" size={14} color={theme.primary} />
            <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>
              {t.common.edit}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={saveEdits}
            disabled={saving}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: theme.primary,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="check" size={14} color="#fff" />
            )}
            <Text style={{ fontSize: 13, color: "#fff", fontWeight: "600" }}>
              {t.auth.saveChanges}
            </Text>
          </Pressable>
        )}
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
            borderColor: isEditing ? theme.primary + "40" : theme.border,
            overflow: "hidden",
            ...cardShadow,
          }}
        >
          {isEditing ? (
            <>
              <EditRow
                icon="user"
                label={t.auth.profileName}
                value={editName}
                onChange={setEditName}
                placeholder={t.auth.namePlaceholder}
              />
              <InfoRow
                icon="mail"
                label={t.auth.email}
                value={user?.email}
              />
              <EditRow
                icon="phone"
                label={t.auth.profilePhone}
                value={editPhone}
                onChange={setEditPhone}
                placeholder={t.auth.phonePlaceholder}
                keyboardType="phone-pad"
              />
              {/* Gender selector */}
              <View
                style={{
                  paddingVertical: 12,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 14 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: theme.primary + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="users" size={16} color={theme.primary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.textMuted,
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t.auth.profileGender}
                  </Text>
                </View>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, paddingHorizontal: 50 }}>
                  {GENDER_OPTIONS.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setEditGender(g)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: "center",
                        backgroundColor: editGender === g ? theme.primary : theme.background,
                        borderWidth: 1,
                        borderColor: editGender === g ? theme.primary : theme.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: editGender === g ? "#fff" : theme.textSecondary,
                        }}
                      >
                        {g === "male" ? t.auth.genderMale : g === "female" ? t.auth.genderFemale : t.auth.genderOther}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
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
                value={genderLabel(profile?.gender)}
              />
            </>
          )}
        </View>

        {/* ── Sign Out ── */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: 16,
            backgroundColor: pressed ? "#EF444410" : theme.card,
            borderWidth: 1.5,
            borderColor: "#EF444440",
            marginTop: 4,
          })}
        >
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#EF444418", alignItems: "center", justifyContent: "center" }}>
            <Feather name="log-out" size={20} color="#EF4444" />
          </View>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>
            {t.auth.signOut}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
