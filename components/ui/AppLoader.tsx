import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet, Platform } from "react-native";
import { AppLogo } from "@/components/ui/AppLogo";
import { useApp } from "@/store/AppContext";

function PulsingDot({ delay, color }: { delay: number; color: string }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.4,
            duration: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={{
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

function SpinningRing({ color }: { color: string }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: color + "25",
        borderTopColor: color,
        transform: [{ rotate: spin }],
      }}
    />
  );
}

function LogoPulse({ children }: { children: React.ReactNode }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      {children}
    </Animated.View>
  );
}

export function AppLoader() {
  const { language, isDark, theme } = useApp();

  const bgColor = isDark ? "#0A1A18" : "#F0FAF7";
  const dotColor = theme.primary;

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity: fadeIn }]}>
      <View style={styles.content}>
        <LogoPulse>
          <AppLogo language={language} isDark={isDark} primaryColor={theme.primary} size="lg" />
        </LogoPulse>

        <View style={styles.spinnerRow}>
          <SpinningRing color={dotColor} />
        </View>

        <View style={styles.dotsRow}>
          <PulsingDot delay={0} color={dotColor} />
          <PulsingDot delay={200} color={dotColor} />
          <PulsingDot delay={400} color={dotColor} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 28,
  },
  spinnerRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
