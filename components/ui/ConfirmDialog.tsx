import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  icon?: FeatherIconName;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmColor,
  icon = "trash-2",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { theme, t, isRTL } = useApp();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const accentColor = confirmColor || "#EF4444";

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onCancel}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          paddingHorizontal: 32,
        }}
      >
        <Pressable
          style={{ position: "absolute", inset: 0 }}
          onPress={onCancel}
        />
        <Animated.View
          style={{
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 28,
            width: "100%",
            maxWidth: 340,
            alignItems: "center",
            gap: 16,
            transform: [{ scale }],
            borderWidth: 1.5,
            borderColor: accentColor + "30",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: accentColor + "15",
              borderWidth: 1.5,
              borderColor: accentColor + "30",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name={icon} size={28} color={accentColor} />
          </View>

          <View style={{ alignItems: "center", gap: 6 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: theme.text,
                textAlign: "center",
              }}
            >
              {title}
            </Text>
            {!!message && (
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {message}
              </Text>
            )}
          </View>

          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              gap: 10,
              width: "100%",
              marginTop: 4,
            }}
          >
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? theme.cardSecondary : theme.background,
                borderWidth: 1.5,
                borderColor: theme.border,
              })}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: theme.textSecondary,
                }}
              >
                {cancelLabel || t.common.cancel}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onConfirm();
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? accentColor + "cc" : accentColor,
              })}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                {confirmLabel || t.common.delete}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
