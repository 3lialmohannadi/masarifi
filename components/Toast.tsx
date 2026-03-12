import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp, type ToastItem } from "@/store/AppContext";

const ICONS: Record<string, string> = {
  success: "check-circle",
  error: "alert-circle",
  info: "info",
};

const BG_COLORS: Record<string, string> = {
  success: "#16A34A",
  error: "#DC2626",
  info: "#2F8F83",
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: () => void;
}

function ToastBanner({ toast, onDismiss }: ToastProps) {
  const { isRTL } = useApp();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      translateY.setValue(-100);
      opacity.setValue(0);
    };
  }, [toast.id, opacity, translateY]);

  const bgColor = BG_COLORS[toast.type] ?? BG_COLORS.info;
  const iconName = ICONS[toast.type] ?? ICONS.info;
  const topOffset = Platform.OS === "web" ? insets.top + 67 + 8 : insets.top + 12;

  return (
    // Outer View handles positioning + pointerEvents so Animated.View never holds
    // pointerEvents in its own style, avoiding the React Native Web deprecation warning.
    <View
      style={{
        position: "absolute",
        top: topOffset,
        left: 16,
        right: 16,
        zIndex: 9999,
        pointerEvents: "box-none",
      }}
    >
      <Animated.View style={{ transform: [{ translateY }], opacity }}>
        <Pressable
          onPress={onDismiss}
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: bgColor,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            ...(Platform.OS === "web"
              ? { boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }
              : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.22,
                  shadowRadius: 12,
                  elevation: 8,
                }),
          }}
        >
          <Feather name={iconName as any} size={20} color="#fff" />
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: "600",
              color: "#fff",
              textAlign: isRTL ? "right" : "left",
            }}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
          <Feather name="x" size={16} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function Toast() {
  const { toast, hideToast } = useApp();
  if (!toast) return null;
  return <ToastBanner key={toast.id} toast={toast} onDismiss={hideToast} />;
}
