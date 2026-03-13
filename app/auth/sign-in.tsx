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

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, isDark, showToast } = useApp();

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
            <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text }}>
              {t.app.name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: "center",
              }}
            >
              {t.auth.signInSubtitle}
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
              {t.auth.signIn}
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
