import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { supabase } from "@/src/lib/supabase";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import AppLogo from "@/components/ui/AppLogo";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, isDark, language, showToast } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = t.auth.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = t.auth.emailInvalid;
    if (!password) errs.password = t.auth.passwordRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearFieldError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: "" }));

  const handleSignIn = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setAuthError(t.auth.invalidCredentials);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(t.auth.signInSuccess, "success");
        router.replace("/(tabs)");
      }
    } catch {
      setAuthError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            position: "absolute",
            top: insets.top + 12,
            right: isRTL ? undefined : 20,
            left: isRTL ? 20 : undefined,
            zIndex: 10,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="x" size={18} color={theme.textSecondary} />
        </Pressable>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 32,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Title */}
          <View style={{ alignItems: "center", gap: 16, paddingTop: 8 }}>
            <AppLogo language={language} isDark={isDark} primaryColor={theme.primary} size="md" />
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: "800",
                color: theme.text,
                textAlign: "center",
              }}>
                {t.auth.signIn}
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: "center",
                lineHeight: 20,
              }}>
                {t.auth.signInSubtitle}
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 22,
              gap: 18,
              borderWidth: 1,
              borderColor: theme.border,
              ...(Platform.OS === "web"
                ? ({ boxShadow: isDark ? "none" : "0 4px 20px rgba(47,143,131,0.10)" } as object)
                : isDark ? {} : {
                    shadowColor: "#2F8F83",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.10,
                    shadowRadius: 16,
                    elevation: 4,
                  }),
            }}
          >
            {authError ? (
              <View
                style={{
                  backgroundColor: "#EF444415",
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#EF444430",
                }}
              >
                <Feather name="alert-circle" size={15} color="#EF4444" />
                <Text style={{ color: "#EF4444", fontSize: 14, flex: 1, textAlign: isRTL ? "right" : "left" }}>
                  {authError}
                </Text>
              </View>
            ) : null}

            <AppInput
              label={t.auth.email}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldError("email");
                if (authError) setAuthError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder={t.auth.emailPlaceholder}
              error={errors.email}
              fieldDirection="ltr"
            />

            <AppInput
              label={t.auth.password}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearFieldError("password");
                if (authError) setAuthError("");
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              placeholder={t.auth.passwordPlaceholder}
              error={errors.password}
              fieldDirection="ltr"
              rightElement={
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={8}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              }
            />

            <AppButton
              title={t.auth.signIn}
              onPress={handleSignIn}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>
              {t.auth.noAccount}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.replace("/auth/sign-up");
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: theme.primary,
                }}
              >
                {t.auth.signUp}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
