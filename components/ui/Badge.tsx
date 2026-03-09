import React from "react";
import { View, Text } from "react-native";
import { useApp } from "@/store/AppContext";

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: "sm" | "md";
}

export function Badge({ label, color, textColor, size = "sm" }: BadgeProps) {
  const { theme } = useApp();
  const bg = color || theme.primaryLight;
  const tc = textColor || theme.primary;
  const padding = size === "md" ? { paddingHorizontal: 10, paddingVertical: 4 } : { paddingHorizontal: 8, paddingVertical: 3 };

  return (
    <View style={[{ borderRadius: 20, ...padding }, { backgroundColor: bg }]}>
      <Text style={{ color: tc, fontSize: size === "md" ? 13 : 11, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}
