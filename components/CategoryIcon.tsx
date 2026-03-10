import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CategoryIconProps {
  name?: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ name = "tag", size = 22, color = "#999" }: CategoryIconProps) {
  return (
    <MaterialCommunityIcons name={name as any} size={size} color={color} />
  );
}
