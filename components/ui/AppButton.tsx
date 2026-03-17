import React, { useRef } from "react";
import { Pressable, Text, ActivityIndicator, ViewStyle, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
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
  const scale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30, bounciness: 0 }),
      Animated.timing(rippleOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (variant === "danger") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const paddingV = size === "sm" ? 9 : size === "lg" ? 17 : 13;
  const paddingH = size === "sm" ? 16 : size === "lg" ? 26 : 20;
  const fontSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;
  const borderRadius = size === "sm" ? 10 : size === "lg" ? 16 : 13;

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case "primary": return "#FFFFFF";
      case "danger": return "#FFFFFF";
      case "secondary": return theme.text;
      case "ghost": return theme.primary;
      case "outline": return theme.primary;
      default: return "#FFFFFF";
    }
  };

  const primaryGradient: [string, string] = disabled
    ? [theme.border, theme.border]
    : [theme.primary, theme.primaryDark || "#1e6b62"];

  const dangerGradient: [string, string] = ["#F87171", "#DC2626"];

  const commonContentStyle = {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
    paddingVertical: paddingV,
    paddingHorizontal: paddingH,
    borderRadius,
  };

  const textEl = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : null}
      <Text style={{ color: getTextColor(), fontSize, fontWeight: "700", letterSpacing: 0.2 }}>
        {title}
      </Text>
    </>
  );

  const containerStyle = [
    { width: fullWidth ? "100%" : undefined, transform: [{ scale }] } as ViewStyle,
    style,
  ];

  if (variant === "primary" || variant === "danger") {
    const gradientColors = variant === "primary" ? primaryGradient : dangerGradient;
    return (
      <Animated.View style={containerStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={{ borderRadius, overflow: "hidden", opacity: disabled ? 0.65 : 1 }}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={commonContentStyle}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(255,255,255,0.15)",
                opacity: rippleOpacity,
                borderRadius,
              }}
            />
            {textEl}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  const getBg = (pressed: boolean) => {
    if (disabled) return theme.border;
    if (variant === "secondary") return pressed ? theme.cardSecondary : theme.card;
    return pressed ? theme.cardSecondary : "transparent";
  };

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({ pressed }) => ({
          backgroundColor: getBg(pressed),
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          borderRadius,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          borderWidth: variant === "outline" || variant === "secondary" ? 1.5 : 0,
          borderColor:
            variant === "outline"
              ? theme.primary
              : variant === "secondary"
              ? theme.border
              : "transparent",
          opacity: disabled ? 0.65 : 1,
        })}
      >
        {textEl}
      </Pressable>
    </Animated.View>
  );
}
