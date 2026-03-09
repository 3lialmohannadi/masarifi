import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useApp } from "@/store/AppContext";

interface ThemedTextProps extends TextProps {
  variant?: "default" | "secondary" | "muted" | "primary" | "income" | "expense" | "heading" | "title";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  weight?: "regular" | "medium" | "semibold" | "bold";
}

const sizes = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
};

const weights: Record<string, "400" | "500" | "600" | "700"> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function ThemedText({
  variant = "default",
  size = "base",
  weight = "regular",
  style,
  ...props
}: ThemedTextProps) {
  const { theme, isRTL } = useApp();

  const color =
    variant === "secondary"
      ? theme.textSecondary
      : variant === "muted"
      ? theme.textMuted
      : variant === "primary"
      ? theme.primary
      : variant === "income"
      ? theme.income
      : variant === "expense"
      ? theme.expense
      : theme.text;

  return (
    <Text
      style={[
        {
          color,
          fontSize: sizes[size],
          fontWeight: weights[weight],
          textAlign: isRTL ? "right" : "left",
          writingDirection: isRTL ? "rtl" : "ltr",
        },
        style,
      ]}
      {...props}
    />
  );
}
