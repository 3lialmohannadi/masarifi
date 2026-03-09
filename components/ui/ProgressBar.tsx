import React from "react";
import { View } from "react-native";
import { useApp } from "@/store/AppContext";

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  backgroundColor,
}: ProgressBarProps) {
  const { theme } = useApp();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const barColor = color || theme.primary;

  const getColor = () => {
    if (clampedProgress >= 1) return "#EF4444";
    if (clampedProgress >= 0.8) return "#F59E0B";
    return barColor;
  };

  return (
    <View
      style={{
        height,
        backgroundColor: backgroundColor || theme.border,
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${clampedProgress * 100}%`,
          backgroundColor: getColor(),
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
