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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, isDark, showToast } = useApp();

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

  const cardShadow =
    Platform.OS !== "web" && !isDark
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 2,
        }
      : {};

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
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Feather name="check-circle" size={40} color={theme.primary} />
        </View>
        <Text
          style={{
            fontSize: 20,
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
            paddingHorizontal: 32,
            paddingVertical: 14,
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
          <Feather name="x" size={18} color={theme.textSecondary} />
        </Pressable>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 32,
            gap: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="dollar-sign" size={36} color="#fff" />
            </View>
            <Text
              style={{ fontSize: 26, fontWeight: "800", color: theme.text }}
            >
              {t.app.name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: "center",
              }}
            >
              {t.auth.signUpSubtitle}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              padding: 20,
              gap: 16,
              borderWidth: 1,
              borderColor: theme.border,
              ...cardShadow,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: theme.text,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {t.auth.signUp}
            </Text>

            {authError ? (
              <View
                style={{
                  backgroundColor: "#EF444415",
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Feather name="alert-circle" size={15} color="#EF4444" />
                <Text
                  style={{
                    color: "#EF4444",
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
