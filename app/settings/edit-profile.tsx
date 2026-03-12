import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import type { Gender } from "@/types";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, showToast } = useApp();
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [gender, setGender] = useState<Gender | null>(user?.gender || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string }>({});

  const handleSave = async () => {
    if (!fullName.trim()) {
      setErrors({ fullName: t.auth.nameRequired });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        gender,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t.profile.profileUpdated, "success");
      router.back();
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

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
          {t.profile.editProfile}
        </Text>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 40,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Full Name */}
        <AppInput
          label={t.profile.fullName}
          value={fullName}
          onChangeText={(v) => {
            setFullName(v);
            if (errors.fullName) setErrors({});
          }}
          placeholder={isRTL ? "محمد أحمد" : "John Doe"}
          autoCapitalize="words"
          error={errors.fullName}
        />

        {/* Email (read-only) */}
        <AppInput
          label={t.profile.email}
          value={user?.email || ""}
          editable={false}
          fieldDirection="ltr"
          containerStyle={{ opacity: 0.6 }}
        />

        {/* Phone */}
        <AppInput
          label={t.profile.phone}
          value={phone}
          onChangeText={setPhone}
          placeholder={t.profile.phonePlaceholder}
          keyboardType="phone-pad"
          fieldDirection="ltr"
        />

        {/* Gender */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: theme.textSecondary,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {t.profile.gender}
          </Text>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
            {(["male", "female"] as const).map((g) => {
              const active = gender === g;
              const label = g === "male" ? t.profile.male : t.profile.female;
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setGender(gender === g ? null : g);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: active ? theme.primary : theme.card,
                    borderWidth: 1.5,
                    borderColor: active ? theme.primary : theme.inputBorder,
                  }}
                >
                  <Feather
                    name={g === "male" ? "user" : "user"}
                    size={18}
                    color={active ? "#fff" : theme.textSecondary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: active ? "#fff" : theme.text,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <AppButton
          title={t.profile.saveChanges}
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          variant="primary"
          size="lg"
          fullWidth
          style={{ borderRadius: 16, paddingVertical: 18, marginTop: 16 }}
        />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
