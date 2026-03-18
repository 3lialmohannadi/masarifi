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
import { createProfile } from "@/src/lib/profileService";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";
import AppLogo from "@/components/ui/AppLogo";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, isDark, language, showToast } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");
  const [done, setDone] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = t.auth.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = t.auth.emailInvalid;
    if (!password) errs.password = t.auth.passwordRequired;
    else if (password.length < 6) errs.password = t.auth.passwordMinLength;
    if (!confirmPassword) errs.confirmPassword = t.auth.passwordRequired;
    else if (password !== confirmPassword)
      errs.confirmPassword = t.auth.passwordMismatch;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearFieldError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: "" }));

  const handleSignUp = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          setAuthError(t.auth.emailAlreadyInUse);
        } else {
          setAuthError(error.message);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (data?.session) {
        if (data.user) {
          createProfile(data.user.id, data.user.email ?? email.trim().toLowerCase()).catch(() => {});
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(t.auth.signInSuccess, "success");
        router.replace("/(tabs)");
      } else {
        if (data?.user) {
          createProfile(data.user.id, data.user.email ?? email.trim().toLowerCase()).catch(() => {});
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
      }
    } catch {
      setAuthError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: theme.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Feather name="check-circle" size={44} color={theme.primary} />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: theme.text,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {t.auth.signUpSuccessTitle}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          {t.auth.signUpSuccess}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.replace("/auth/sign-in");
          }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? theme.primaryDark : theme.primary,
            paddingHorizontal: 36,
            paddingVertical: 15,
            borderRadius: 14,
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {t.auth.signIn}
          </Text>
        </Pressable>
      </View>
    );
  }

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
                {t.auth.signUp}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {t.auth.signUpSubtitle}
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
                    shadowColor: theme.primary,
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
                  backgroundColor: theme.error + "15",
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: theme.error + "30",
                }}
              >
                <Feather name="alert-circle" size={15} color={theme.error} />
                <Text
                  style={{
                    color: theme.error,
                    fontSize: 14,
                    flex: 1,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
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
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
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

            <AppInput
              label={t.auth.confirmPassword}
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                clearFieldError("confirmPassword");
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder={t.auth.confirmPasswordPlaceholder}
              error={errors.confirmPassword}
              fieldDirection="ltr"
              rightElement={
                <Pressable
                  onPress={() => setShowConfirmPassword((s) => !s)}
                  hitSlop={8}
                >
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              }
            />

            <AppButton
              title={t.auth.signUp}
              onPress={handleSignUp}
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
              {t.auth.alreadyHaveAccount}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.replace("/auth/sign-in");
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: theme.primary,
                }}
              >
                {t.auth.signIn}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
