import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const { theme } = useApp();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 40, gap: 12 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.cardSecondary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon as any} size={28} color={theme.textMuted} />
      </View>
      <Text style={{ fontSize: 17, fontWeight: "600", color: theme.text, textAlign: "center" }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center" }}>
          {subtitle}
        </Text>
      )}
      {action}
    </View>
  );
}
