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
    <View style={{ alignItems: "center", justifyContent: "center", padding: 40, gap: 14 }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: theme.primaryLight || `${theme.primary}15`,
          borderWidth: 1.5,
          borderColor: `${theme.primary}20`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon as any} size={36} color={theme.primary} />
      </View>
      <View style={{ alignItems: "center", gap: 6 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: theme.text,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: "center",
              lineHeight: 20,
              maxWidth: 280,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}
