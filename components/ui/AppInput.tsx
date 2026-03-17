import React, { useState, useRef } from "react";
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  translateButton?: boolean;
  onTranslate?: () => void;
  isTranslating?: boolean;
  containerStyle?: object;
  fieldDirection?: "rtl" | "ltr";
}

export function AppInput({
  label,
  error,
  rightElement,
  startIcon,
  endIcon,
  translateButton,
  onTranslate,
  isTranslating,
  containerStyle,
  style,
  fieldDirection,
  ...props
}: AppInputProps) {
  const { theme, isRTL } = useApp();
  const [focused, setFocused] = useState(false);
  const floatAnim = useRef(new Animated.Value(props.value ? 1 : 0)).current;

  const dir = fieldDirection ?? (isRTL ? "rtl" : "ltr");
  const textAlignStyle = dir === "rtl" ? "right" : "left";
  const hasFloatingLabel = !!label && !rightElement && !startIcon && !endIcon && !translateButton;

  const animateLabel = (toValue: number) => {
    Animated.timing(floatAnim, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  type FocusEventParam = Parameters<NonNullable<TextInputProps["onFocus"]>>[0];
  type BlurEventParam = Parameters<NonNullable<TextInputProps["onBlur"]>>[0];

  const handleFocus = (e: FocusEventParam) => {
    setFocused(true);
    animateLabel(1);
    props.onFocus?.(e);
  };

  const handleBlur = (e: BlurEventParam) => {
    setFocused(false);
    if (!props.value) {
      animateLabel(0);
    }
    props.onBlur?.(e);
  };

  const borderColor = error ? "#EF4444" : focused ? theme.primary : theme.inputBorder;

  const floatingTop = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, -10],
  });
  const floatingFontSize = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 12],
  });
  const floatingColor = focused ? theme.primary : error ? "#EF4444" : theme.textSecondary;

  if (hasFloatingLabel) {
    return (
      <View style={[{ marginTop: 8 }, containerStyle]}>
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            backgroundColor: theme.input,
            borderRadius: 13,
            borderWidth: 1.5,
            borderColor,
            paddingHorizontal: 12,
            paddingTop: 16,
            paddingBottom: 4,
            gap: 8,
          }}
        >
          <Animated.Text
            style={{
              position: "absolute",
              [isRTL ? "right" : "left"]: 13,
              top: floatingTop,
              fontSize: floatingFontSize,
              color: floatingColor,
              fontWeight: "600",
              backgroundColor: theme.input,
              paddingHorizontal: 4,
            }}
            pointerEvents="none"
          >
            {label}
          </Animated.Text>
          <TextInput
            style={[
              {
                flex: 1,
                paddingVertical: 6,
                paddingTop: 8,
                fontSize: 15,
                color: theme.text,
                textAlign: props.textAlign ?? textAlignStyle,
                writingDirection: dir,
              },
              style,
            ]}
            placeholderTextColor="transparent"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </View>
        {error && (
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Feather name="alert-circle" size={12} color="#EF4444" />
            <Text style={{ fontSize: 12, color: "#EF4444", flex: 1, textAlign: isRTL ? "right" : "left" }}>
              {error}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: focused ? theme.primary : error ? "#EF4444" : theme.textSecondary,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          backgroundColor: theme.input,
          borderRadius: 13,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        {startIcon && <View style={{ opacity: focused ? 1 : 0.6 }}>{startIcon}</View>}
        <TextInput
          style={[
            {
              flex: 1,
              paddingVertical: 13,
              fontSize: 15,
              color: theme.text,
              textAlign: props.textAlign ?? textAlignStyle,
              writingDirection: dir,
            },
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {translateButton && (
          <Pressable
            onPress={onTranslate}
            disabled={isTranslating}
            style={{
              padding: 6,
              backgroundColor: theme.primaryLight,
              borderRadius: 8,
            }}
          >
            {isTranslating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Feather name="globe" size={16} color={theme.primary} />
            )}
          </Pressable>
        )}
        {endIcon && <View style={{ opacity: focused ? 1 : 0.6 }}>{endIcon}</View>}
        {rightElement}
      </View>
      {error && (
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
          <Feather name="alert-circle" size={12} color="#EF4444" />
          <Text style={{ fontSize: 12, color: "#EF4444", flex: 1, textAlign: isRTL ? "right" : "left" }}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
