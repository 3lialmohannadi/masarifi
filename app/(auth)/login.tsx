import React, { useState } from "react";
import { View, Text, Pressable, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, showToast } = useApp();
  const { loginWithEmail } = useAuth();
  const { signIn: googleSignIn, loading: googleLoading, isConfigured: googleConfigured } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t.auth.emailInvalid;
    }
    if (!password) {
      newErrors.password = t.auth.passwordRequired;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t.auth.loginSuccess, "success");
      router.replace("/(tabs)");
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NETWORK_ERROR") {
        showToast(t.auth.networkError, "error");
      } else if (msg === "SERVER_ERROR") {
        showToast(t.auth.serverError, "error");
      } else if (msg.includes("Invalid") || msg.includes("401")) {
        setErrors({ password: t.auth.invalidCredentials });
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
          {t.auth.login}
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
          autoComplete="password"
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

        {/* Forgot Password */}
        <Pressable
          onPress={() => router.push("/(auth)/forgot-password")}
          style={{ alignSelf: isRTL ? "flex-start" : "flex-end" }}
        >
          <Text style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}>
            {t.auth.forgotPassword}
          </Text>
        </Pressable>

        {/* Login Button */}
        <AppButton
          title={t.auth.login}
          onPress={handleLogin}
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
          onPress={async () => {
            Haptics.selectionAsync();
            if (!googleConfigured) {
              showToast(t.auth.googleNotConfigured, "info");
              return;
            }
            try {
              await googleSignIn();
            } catch {
              showToast(t.toast.error, "error");
            }
          }}
          disabled={googleLoading}
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
            opacity: googleLoading ? 0.6 : 1,
          })}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color={theme.text} />
          ) : (
            <Text style={{ fontSize: 20 }}>G</Text>
          )}
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            {t.auth.continueWithGoogle}
          </Text>
        </Pressable>

        {/* Sign Up Link */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            justifyContent: "center",
            gap: 4,
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>{t.auth.noAccount}</Text>
          <Pressable onPress={() => router.replace("/(auth)/signup")}>
            <Text style={{ fontSize: 14, color: theme.primary, fontWeight: "700" }}>
              {t.auth.signup}
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
