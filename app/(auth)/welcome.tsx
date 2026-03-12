import React from "react";
import { View, Text, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/store/AppContext";
import { AppButton } from "@/components/ui/AppButton";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, isDark } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Top section with logo and branding */}
        <View style={{ alignItems: "center", gap: 16, flex: 1, justifyContent: "center" }}>
          <Image
            source={require("@/assets/logo_transparent.png")}
            resizeMode="contain"
            style={{ width: 220, height: 80 }}
          />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: theme.text,
              textAlign: "center",
              marginTop: 24,
            }}
          >
            {t.auth.welcome}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.textSecondary,
              textAlign: "center",
              lineHeight: 24,
              maxWidth: 280,
            }}
          >
            {t.auth.welcomeSubtitle}
          </Text>
        </View>

        {/* Bottom section with buttons */}
        <View style={{ width: "100%", gap: 12, paddingBottom: 20 }}>
          <AppButton
            title={t.auth.getStarted}
            onPress={() => router.push("/(auth)/signup")}
            variant="primary"
            size="lg"
            fullWidth
            style={{ borderRadius: 16, paddingVertical: 18 }}
          />
          <AppButton
            title={t.auth.login}
            onPress={() => router.push("/(auth)/login")}
            variant="outline"
            size="lg"
            fullWidth
            style={{ borderRadius: 16, paddingVertical: 18 }}
          />
        </View>
      </View>
    </View>
  );
}
