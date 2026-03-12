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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, showToast } = useApp();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t.auth.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.auth.emailInvalid);
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
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
          {t.auth.forgotPasswordTitle}
        </Text>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 40,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {sent ? (
          /* Success State */
          <View style={{ alignItems: "center", gap: 16, paddingTop: 40 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.incomeBackground,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="mail" size={36} color={theme.income} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: theme.text,
                textAlign: "center",
              }}
            >
              {t.auth.resetPasswordSent}
            </Text>
            <AppButton
              title={t.auth.backToLogin}
              onPress={() => router.replace("/(auth)/login")}
              variant="outline"
              size="lg"
              fullWidth
              style={{ borderRadius: 16, paddingVertical: 18, marginTop: 16 }}
            />
          </View>
        ) : (
          /* Form State */
          <>
            <Text
              style={{
                fontSize: 15,
                color: theme.textSecondary,
                textAlign: isRTL ? "right" : "left",
                lineHeight: 24,
              }}
            >
              {t.auth.forgotPasswordDesc}
            </Text>

            <AppInput
              label={t.auth.email}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError("");
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={error}
              fieldDirection="ltr"
            />

            <AppButton
              title={t.auth.sendResetLink}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              variant="primary"
              size="lg"
              fullWidth
              style={{ borderRadius: 16, paddingVertical: 18, marginTop: 8 }}
            />

            <Pressable
              onPress={() => router.back()}
              style={{ alignSelf: "center", marginTop: 12 }}
            >
              <Text style={{ fontSize: 14, color: theme.primary, fontWeight: "600" }}>
                {t.auth.backToLogin}
              </Text>
            </Pressable>
          </>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
