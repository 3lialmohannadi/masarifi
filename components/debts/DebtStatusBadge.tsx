import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import type { DebtStatus } from "@/types";

interface Props {
  status: DebtStatus;
  small?: boolean;
}

export function DebtStatusBadge({ status, small = false }: Props) {
  const { t } = useApp();

  const config: Record<DebtStatus, { label: string; bg: string; text: string; icon: string }> = {
    active:    { label: t.debts.status.active,    bg: "#2F8F8318", text: "#2F8F83", icon: "activity" },
    completed: { label: t.debts.status.completed, bg: "#10B98118", text: "#059669", icon: "check-circle" },
    overdue:   { label: t.debts.status.overdue,   bg: "#EF444418", text: "#EF4444", icon: "alert-circle" },
  };

  const c = config[status];
  const padding = small ? { paddingHorizontal: 8, paddingVertical: 3 } : { paddingHorizontal: 10, paddingVertical: 4 };
  const fontSize = small ? 10 : 12;
  const iconSize = small ? 10 : 12;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.bg, borderRadius: 20, ...padding }}>
      <Feather name={c.icon as any} size={iconSize} color={c.text} />
      <Text style={{ fontSize, fontWeight: "600", color: c.text }}>{c.label}</Text>
    </View>
  );
}
