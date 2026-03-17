import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
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
  animated = true,
}: ProgressBarProps) {
  const { theme } = useApp();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const widthAnim = useRef(new Animated.Value(0)).current;

  const isComplete = clampedProgress >= 1;
  const isWarning = clampedProgress >= 0.8 && !isComplete;

  const barColor = color != null
    ? color
    : isComplete
    ? "#EF4444"
    : isWarning
    ? "#F59E0B"
    : theme.primary;

  useEffect(() => {
    if (animated) {
      Animated.spring(widthAnim, {
        toValue: clampedProgress,
        useNativeDriver: false,
        tension: 60,
        friction: 12,
      }).start();
    } else {
      widthAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        height,
        backgroundColor: trackColor || backgroundColor || theme.border,
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          width: animatedWidth,
          backgroundColor: barColor,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
