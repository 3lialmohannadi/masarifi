import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
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

  const dir = fieldDirection ?? (isRTL ? "rtl" : "ltr");
  const textAlignStyle = dir === "rtl" ? "right" : "left";

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: theme.textSecondary,
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
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: focused ? theme.primary : error ? "#EF4444" : theme.inputBorder,
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        <TextInput
          style={[
            {
              flex: 1,
              paddingVertical: 12,
              fontSize: 15,
              color: theme.text,
              textAlign: props.textAlign ?? textAlignStyle,
              writingDirection: dir,
            },
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
        {rightElement}
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>
          {error}
        </Text>
      )}
    </View>
  );
}
