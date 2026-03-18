import React from "react";
import { View, Text, Image } from "react-native";
import { Language } from "@/i18n/types";

interface AppLogoProps {
  language: Language;
  isDark: boolean;
  primaryColor: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { icon: 28, fontSize: 16, gap: 7, letterSpacing: 1.2 },
  md: { icon: 36, fontSize: 20, gap: 9, letterSpacing: 1.5 },
  lg: { icon: 46, fontSize: 26, gap: 11, letterSpacing: 2 },
};

export default function AppLogo({ language, isDark, primaryColor, size = "md" }: AppLogoProps) {
  const s = SIZES[size];
  const isAr = language === "ar";
  const textColor = isDark ? "#ffffff" : primaryColor;

  return (
    <View
      style={{
        flexDirection: isAr ? "row-reverse" : "row",
        alignItems: "center",
        gap: s.gap,
      }}
    >
      <Image
        source={require("@/assets/images/wallet_mark.png")}
        style={{ width: s.icon, height: s.icon }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontSize: s.fontSize,
          fontWeight: "900",
          color: textColor,
          letterSpacing: s.letterSpacing,
        }}
      >
        {isAr ? "مصاريفي" : "MASARIFI"}
      </Text>
    </View>
  );
}
