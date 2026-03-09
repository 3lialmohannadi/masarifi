import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { useApp } from "@/store/AppContext";

interface ThemedViewProps extends ViewProps {
  variant?: "default" | "card" | "secondary";
}

export function ThemedView({ variant = "default", style, ...props }: ThemedViewProps) {
  const { theme } = useApp();
  const bg =
    variant === "card"
      ? theme.card
      : variant === "secondary"
      ? theme.cardSecondary
      : theme.background;
  return <View style={[{ backgroundColor: bg }, style]} {...props} />;
}
