import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp, type ToastItem } from "@/store/AppContext";

const ICONS: Record<string, string> = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
  warning: "alert-triangle",
};

const BG_COLORS: Record<string, string> = {
  success: "#16A34A",
  error: "#DC2626",
  info: "#2F8F83",
  warning: "#D97706",
};

const ACCENT_COLORS: Record<string, string> = {
  success: "rgba(255,255,255,0.25)",
  error: "rgba(255,255,255,0.25)",
  info: "rgba(255,255,255,0.25)",
  warning: "rgba(255,255,255,0.25)",
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: () => void;
}

function ToastBanner({ toast, onDismiss }: ToastProps) {
  const { isRTL } = useApp();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }),
    ]).start();

    return () => {
      translateY.setValue(-120);
      opacity.setValue(0);
      scale.setValue(0.92);
    };
  }, [toast.id, opacity, translateY, scale]);

  const bgColor = BG_COLORS[toast.type] ?? BG_COLORS.info;
  const iconName = ICONS[toast.type] ?? ICONS.info;
  const accentColor = ACCENT_COLORS[toast.type] ?? ACCENT_COLORS.info;
  const topOffset = Platform.OS === "web" ? insets.top + 67 + 8 : insets.top + 12;

  return (
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
      <Animated.View style={{ transform: [{ translateY }, { scale }], opacity }}>
        <Pressable
          onPress={onDismiss}
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: bgColor,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
            ...(Platform.OS === "web"
              ? { boxShadow: "0 6px 28px rgba(0,0,0,0.28)" }
              : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.24,
                  shadowRadius: 14,
                  elevation: 10,
                }),
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: accentColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name={iconName as any} size={20} color="#fff" />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: "600",
              color: "#fff",
              textAlign: isRTL ? "right" : "left",
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
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
