import React from "react";
import { Image } from "react-native";
import type { Language } from "@/i18n/types";

interface AppLogoProps {
  language: Language;
  isDark: boolean;
  primaryColor?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  ar: {
    sm:  { width: 130, height: 38 },
    md:  { width: 170, height: 50 },
    lg:  { width: 210, height: 62 },
  },
  en: {
    sm:  { width: 100, height: 22 },
    md:  { width: 135, height: 30 },
    lg:  { width: 175, height: 40 },
  },
};

export default function AppLogo({ language, isDark, size = "md" }: AppLogoProps) {
  const isAr = language === "ar";
  const dims = SIZES[isAr ? "ar" : "en"][size];

  const source = isAr
    ? (isDark
        ? require("@/assets/logo_ar_dark.png")
        : require("@/assets/logo_ar_light.png"))
    : (isDark
        ? require("@/assets/logo_en_dark.png")
        : require("@/assets/logo_en_light.png"));

  return (
    <Image
      source={source}
      style={{ width: dims.width, height: dims.height }}
      resizeMode="contain"
    />
  );
}
