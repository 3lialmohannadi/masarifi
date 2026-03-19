import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar as RNStatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/store/AppContext";
import { apiRequest } from "@/services/api";
import type { Language } from "@/types";
import type { TranslationKeys } from "@/i18n/en";
import AppLogo from "@/components/ui/AppLogo";

const { width: SCREEN_W } = Dimensions.get("window");

const GRADIENT: [string, string, string] = ["#2D8F83", "#1E6B63", "#165550"];
const DARK_GRADIENT: [string, string, string] = ["#1A3630", "#0F2820", "#0A1C16"];

const CURRENCIES = [
  { code: "QAR", flag: "🇶🇦" },
  { code: "SAR", flag: "🇸🇦" },
  { code: "AED", flag: "🇦🇪" },
  { code: "KWD", flag: "🇰🇼" },
  { code: "BHD", flag: "🇧🇭" },
  { code: "OMR", flag: "🇴🇲" },
  { code: "USD", flag: "🇺🇸" },
  { code: "EUR", flag: "🇪🇺" },
];

function Slide1({ t, language, isDark }: { t: TranslationKeys; language: Language; isDark: boolean }) {
  const features = [
    { icon: "dollar-sign" as const, label: t.onboarding.feature1Title },
    { icon: "bar-chart-2" as const, label: t.onboarding.feature3Title },
    { icon: "target" as const, label: t.onboarding.feature2Title },
  ];
  return (
    <View style={{ width: SCREEN_W, flex: 1, alignItems: "center", justifyContent: "space-evenly", paddingHorizontal: 32, paddingVertical: 24 }}>
      <AppLogo language={language} isDark={true} primaryColor="#2D8F83" size="lg" />
      <View style={{ alignItems: "center", gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 38 }}>
          {t.onboarding.slide1Title}
        </Text>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 24 }}>
          {t.onboarding.slide1Subtitle}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 20, justifyContent: "center" }}>
        {features.map((f, i) => (
          <View key={i} style={{ alignItems: "center", gap: 10 }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
              <Feather name={f.icon} size={30} color="#fff" />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
              {f.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Slide2({ t, isRTL }: { t: TranslationKeys; isRTL: boolean }) {
  const features = [
    { icon: "credit-card" as const, title: t.onboarding.feature1Title, desc: t.onboarding.feature1Desc },
    { icon: "repeat" as const, title: t.onboarding.feature2Title, desc: t.onboarding.feature2Desc },
    { icon: "trending-up" as const, title: t.onboarding.feature3Title, desc: t.onboarding.feature3Desc },
  ];
  return (
    <View style={{ width: SCREEN_W, flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 36 }}>
        {t.onboarding.slide2Title}
      </Text>
      <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 22, marginBottom: 4 }}>
        {t.onboarding.slide2Subtitle}
      </Text>
      <View style={{ gap: 14 }}>
        {features.map((f, i) => (
          <View key={i} style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 16, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Feather name={f.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", textAlign: isRTL ? "right" : "left" }}>{f.title}</Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 18, textAlign: isRTL ? "right" : "left" }}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Slide3({ t, language, setLanguage, defaultCurrency, setCurrency }: {
  t: TranslationKeys; language: Language; setLanguage: (l: Language) => void;
  defaultCurrency: string; setCurrency: (c: string) => void;
}) {
  return (
    <View style={{ width: SCREEN_W, flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 24 }}>
      <View style={{ alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 36 }}>
          {t.onboarding.slide3Title}
        </Text>
        <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 22 }}>
          {t.onboarding.slide3Subtitle}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "600", textAlign: "center" }}>
          {t.onboarding.language}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
          {(["ar", "en"] as Language[]).map((lang) => (
            <Pressable
              key={lang}
              onPress={() => { Haptics.selectionAsync(); setLanguage(lang); }}
              style={{
                flex: 1, maxWidth: 140, paddingVertical: 14, borderRadius: 16, alignItems: "center",
                backgroundColor: language === lang ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                borderWidth: 2, borderColor: language === lang ? "#fff" : "rgba(255,255,255,0.3)",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: language === lang ? "#1E6B63" : "#fff" }}>
                {lang === "ar" ? "العربية" : "English"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "600", textAlign: "center" }}>
          {t.onboarding.currency}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => { Haptics.selectionAsync(); setCurrency(c.code); }}
              style={{
                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 5,
                backgroundColor: defaultCurrency === c.code ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                borderWidth: 1.5, borderColor: defaultCurrency === c.code ? "#fff" : "rgba(255,255,255,0.25)",
              }}
            >
              <Text style={{ fontSize: 16 }}>{c.flag}</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: defaultCurrency === c.code ? "#1E6B63" : "#fff" }}>
                {c.code}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Slide4({ t }: { t: TranslationKeys }) {
  return (
    <View style={{ width: SCREEN_W, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 32 }}>
      <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" }}>
          <Feather name="check" size={38} color="#1E6B63" />
        </View>
      </View>
      <View style={{ alignItems: "center", gap: 14 }}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: "#fff", textAlign: "center" }}>
          {t.onboarding.slide4Title}
        </Text>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 24 }}>
          {t.onboarding.slide4Subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { t, settings, language, setLanguage, updateSettings, isDark, isRTL } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localCurrency, setLocalCurrency] = useState(settings.default_currency || "QAR");
  const flatRef = useRef<FlatList>(null);
  const TOTAL = 4;

  const gradient = isDark ? DARK_GRADIENT : GRADIENT;

  const goTo = (logicalIndex: number) => {
    const dataIndex = isRTL ? TOTAL - 1 - logicalIndex : logicalIndex;
    flatRef.current?.scrollToIndex({ index: dataIndex, animated: true });
    setCurrentIndex(logicalIndex);
  };

  const handleNext = () => {
    if (currentIndex < TOTAL - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goTo(currentIndex + 1);
    } else {
      handleStart();
    }
  };

  const finishOnboarding = (lang: Language, currency: string) => {
    updateSettings({ onboarded: true, language: lang, default_currency: currency });
    apiRequest("PATCH", "/api/settings", { onboarded: true, language: lang, default_currency: currency })
      .catch((e: unknown) => console.warn("[Onboarding] settings sync failed:", e));
    router.replace("/(tabs)");
  };

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finishOnboarding(language, localCurrency);
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    finishOnboarding(language, localCurrency);
  };

  const handleCurrencyChange = (code: string) => {
    setLocalCurrency(code);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(offsetX / SCREEN_W);
    const logicalIndex = isRTL ? TOTAL - 1 - rawIndex : rawIndex;
    setCurrentIndex(Math.max(0, Math.min(TOTAL - 1, logicalIndex)));
  };

  const isLast = currentIndex === TOTAL - 1;

  const forwardSlides = [
    <Slide1 key="1" t={t} language={language} isDark={isDark} />,
    <Slide2 key="2" t={t} isRTL={isRTL} />,
    <Slide3
      key="3"
      t={t}
      language={language}
      setLanguage={setLanguage}
      defaultCurrency={localCurrency}
      setCurrency={handleCurrencyChange}
    />,
    <Slide4 key="4" t={t} />,
  ];

  const slides = isRTL ? [...forwardSlides].reverse() : forwardSlides;

  const topPad = insets.top + (Platform.OS === "android" ? 8 : 0);

  return (
    <LinearGradient colors={gradient} style={{ flex: 1 }}>
      <RNStatusBar barStyle="light-content" />

      <View style={{ flex: 1, paddingTop: topPad, paddingBottom: insets.bottom + 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={handleSkip}
            style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              {t.onboarding.skip}
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={flatRef}
          data={slides}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled
          initialScrollIndex={isRTL ? TOTAL - 1 : 0}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => item}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        />

        <View style={{ paddingHorizontal: 28, gap: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <Pressable
                key={i}
                onPress={() => goTo(i)}
                style={{
                  height: 8,
                  width: i === currentIndex ? 28 : 8,
                  borderRadius: 4,
                  backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </View>

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => ({
              backgroundColor: isLast ? "#fff" : "rgba(255,255,255,0.2)",
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
              borderWidth: isLast ? 0 : 1.5,
              borderColor: "rgba(255,255,255,0.4)",
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: "800", color: isLast ? "#1E6B63" : "#fff" }}>
              {isLast ? t.onboarding.start : t.onboarding.next}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}
