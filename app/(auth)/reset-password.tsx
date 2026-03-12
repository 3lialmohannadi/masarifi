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

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, showToast } = useApp();
  const { resetPassword } = useAuth();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    token?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!token.trim()) {
      newErrors.token = t.auth.resetTokenRequired;
    }
    if (!password) {
      newErrors.password = t.auth.passwordRequired;
    } else if (password.length < 6) {
      newErrors.password = t.auth.passwordMin;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.auth.passwordMismatch;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t.auth.resetPasswordSuccess, "success");
      router.replace("/(auth)/login");
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Invalid") || msg.includes("expired") || msg.includes("400")) {
        setErrors({ token: t.auth.invalidResetToken });
      } else {
        showToast(t.toast.error, "error");
      }
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
          {t.auth.resetPassword}
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
        <Text
          style={{
            fontSize: 15,
            color: theme.textSecondary,
            textAlign: isRTL ? "right" : "left",
            lineHeight: 24,
          }}
        >
          {t.auth.resetPasswordDesc}
        </Text>

        {/* Reset Token */}
        <AppInput
          label={t.auth.resetToken}
          value={token}
          onChangeText={(v) => {
            setToken(v);
            if (errors.token) setErrors((e) => ({ ...e, token: undefined }));
          }}
          placeholder={t.auth.resetTokenPlaceholder}
          autoCapitalize="none"
          error={errors.token}
          fieldDirection="ltr"
        />

        {/* New Password */}
        <AppInput
          label={t.auth.newPassword}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          error={errors.password}
          fieldDirection="ltr"
          rightElement={
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={theme.textMuted}
              />
            </Pressable>
          }
        />

        {/* Confirm Password */}
        <AppInput
          label={t.auth.confirmPassword}
          value={confirmPassword}
          onChangeText={(v) => {
            setConfirmPassword(v);
            if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
          }}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          error={errors.confirmPassword}
          fieldDirection="ltr"
        />

        {/* Reset Button */}
        <AppButton
          title={t.auth.resetPassword}
          onPress={handleReset}
          loading={loading}
          disabled={loading}
          variant="primary"
          size="lg"
          fullWidth
          style={{ borderRadius: 16, paddingVertical: 18, marginTop: 8 }}
        />

        {/* Back to Login */}
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={{ alignSelf: "center", marginTop: 12 }}
        >
          <Text style={{ fontSize: 14, color: theme.primary, fontWeight: "600" }}>
            {t.auth.backToLogin}
          </Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
