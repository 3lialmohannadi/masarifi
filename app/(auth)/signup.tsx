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

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, showToast } = useApp();
  const { signupWithEmail } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) {
      newErrors.fullName = t.auth.nameRequired;
    }
    if (!email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t.auth.emailInvalid;
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

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signupWithEmail(email.trim().toLowerCase(), password, fullName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t.auth.signupSuccess, "success");
      router.replace("/(tabs)");
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("already") || msg.includes("409")) {
        setErrors({ email: t.auth.emailExists });
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
          {t.auth.signup}
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
          label={t.auth.fullName}
          value={fullName}
          onChangeText={(v) => {
            setFullName(v);
            if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
          }}
          placeholder={isRTL ? "محمد أحمد" : "John Doe"}
          autoCapitalize="words"
          autoComplete="name"
          error={errors.fullName}
        />

        {/* Email */}
        <AppInput
          label={t.auth.email}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          fieldDirection="ltr"
        />

        {/* Password */}
        <AppInput
          label={t.auth.password}
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

        {/* Sign Up Button */}
        <AppButton
          title={t.auth.signup}
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
          variant="primary"
          size="lg"
          fullWidth
          style={{ borderRadius: 16, paddingVertical: 18, marginTop: 8 }}
        />

        {/* Divider */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
          <Text style={{ fontSize: 12, color: theme.textMuted }}>{t.auth.orContinueWith}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        </View>

        {/* Google Sign-In */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            showToast(t.auth.googleNotConfigured, "info");
          }}
          style={({ pressed }) => ({
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: pressed ? theme.cardSecondary : theme.card,
            borderWidth: 1.5,
            borderColor: theme.border,
          })}
        >
          <Text style={{ fontSize: 20 }}>G</Text>
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            {t.auth.continueWithGoogle}
          </Text>
        </Pressable>

        {/* Login Link */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            justifyContent: "center",
            gap: 4,
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>{t.auth.hasAccount}</Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text style={{ fontSize: 14, color: theme.primary, fontWeight: "700" }}>
              {t.auth.login}
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
