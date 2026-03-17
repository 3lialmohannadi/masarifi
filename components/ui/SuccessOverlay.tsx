import React, { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";

interface SuccessOverlayProps {
  visible: boolean;
  message?: string;
  color?: string;
}

export function SuccessOverlay({ visible, message, color }: SuccessOverlayProps) {
  const { theme } = useApp();
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const accentColor = color || theme.primary;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.3);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={{
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      opacity,
    }}>
      <Animated.View style={{
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        gap: 12,
        transform: [{ scale }],
        borderWidth: 1.5,
        borderColor: accentColor + "40",
        minWidth: 160,
      }}>
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: accentColor + "18",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: accentColor + "35",
        }}>
          <Feather name="check" size={32} color={accentColor} />
        </View>
        {message && (
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, textAlign: "center" }}>
            {message}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}
