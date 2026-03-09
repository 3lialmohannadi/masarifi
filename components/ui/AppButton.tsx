import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: AppButtonProps) {
  const { theme } = useApp();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getBg = (pressed: boolean) => {
    if (disabled) return theme.border;
    if (variant === "primary") return pressed ? theme.primaryDark : theme.primary;
    if (variant === "secondary") return pressed ? theme.cardSecondary : theme.card;
    if (variant === "danger") return pressed ? "#DC2626" : "#EF4444";
    if (variant === "ghost") return pressed ? theme.cardSecondary : "transparent";
    if (variant === "outline") return pressed ? theme.cardSecondary : "transparent";
    return theme.primary;
  };

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    if (variant === "primary") return "#FFFFFF";
    if (variant === "danger") return "#FFFFFF";
    if (variant === "secondary") return theme.text;
    if (variant === "ghost") return theme.primary;
    if (variant === "outline") return theme.primary;
    return "#FFFFFF";
  };

  const paddingV = size === "sm" ? 8 : size === "lg" ? 16 : 12;
  const paddingH = size === "sm" ? 14 : size === "lg" ? 24 : 18;
  const fontSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: getBg(pressed),
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: pressed ? 0.9 : 1,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: variant === "outline" ? theme.primary : "transparent",
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={getTextColor()} />}
      <Text
        style={{
          color: getTextColor(),
          fontSize,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
