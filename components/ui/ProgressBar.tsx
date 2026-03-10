import React from "react";
import { View } from "react-native";
import { useApp } from "@/store/AppContext";

export interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  trackColor?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  backgroundColor,
  trackColor,
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
        backgroundColor: trackColor || backgroundColor || theme.border,
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
