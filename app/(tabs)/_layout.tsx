import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable, Text } from "react-native";
import React, { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useApp } from "@/store/AppContext";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import type { TransactionType } from "@/types";

function NativeTabLayout() {
  const { t, theme } = useApp();
  return (
    <NativeTabs tintColor={theme.primary}>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{t.tabs.dashboard}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <Icon sf={{ default: "arrow.left.arrow.right", selected: "arrow.left.arrow.right.circle.fill" }} />
        <Label>{t.tabs.transactions}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="savings">
        <Icon sf={{ default: "banknote", selected: "banknote.fill" }} />
        <Label>{t.tabs.savings}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="statistics">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>{t.tabs.statistics}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }} />
        <Label>{t.tabs.more}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const { theme, isDark, t, isRTL } = useApp();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isAndroid = Platform.OS === "android";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [qaVisible, setQaVisible] = useState(false);
  const [qaType, setQaType] = useState<TransactionType>("expense");

  const anim1 = useSharedValue(0);
  const anim2 = useSharedValue(0);
  const anim3 = useSharedValue(0);
  const fabRotate = useSharedValue(0);

  function openMenu() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMenuOpen(true);
    anim1.value = withDelay(0, withSpring(1, { damping: 14, stiffness: 280 }));
    anim2.value = withDelay(55, withSpring(1, { damping: 14, stiffness: 280 }));
    anim3.value = withDelay(110, withSpring(1, { damping: 14, stiffness: 280 }));
    fabRotate.value = withSpring(45, { damping: 14, stiffness: 280 });
  }

  function closeMenu(cb?: () => void) {
    anim3.value = withSpring(0, { damping: 14, stiffness: 280 });
    anim2.value = withDelay(40, withSpring(0, { damping: 14, stiffness: 280 }));
    anim1.value = withDelay(80, withSpring(0, { damping: 14, stiffness: 280 }));
    fabRotate.value = withSpring(0, { damping: 14, stiffness: 280 });
    setTimeout(() => {
      setIsMenuOpen(false);
      cb?.();
    }, 200);
  }

  const item1Style = useAnimatedStyle(() => ({
    opacity: interpolate(anim1.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(anim1.value, [0, 1], [16, 0], Extrapolation.CLAMP) }],
  }));
  const item2Style = useAnimatedStyle(() => ({
    opacity: interpolate(anim2.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(anim2.value, [0, 1], [16, 0], Extrapolation.CLAMP) }],
  }));
  const item3Style = useAnimatedStyle(() => ({
    opacity: interpolate(anim3.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(anim3.value, [0, 1], [16, 0], Extrapolation.CLAMP) }],
  }));
  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotate.value}deg` }],
  }));

  const tabBarH = isWeb ? 84 : isIOS ? 83 : 56;
  const fabRise = isAndroid ? 12 : 18;

  const menuItems = [
    {
      icon: "arrow-down-left" as const,
      color: theme.income,
      label: t.transactions.income,
      animStyle: item1Style,
      onPress: () => closeMenu(() => { setQaType("income"); setQaVisible(true); }),
    },
    {
      icon: "arrow-up-right" as const,
      color: theme.expense,
      label: t.transactions.expense,
      animStyle: item2Style,
      onPress: () => closeMenu(() => { setQaType("expense"); setQaVisible(true); }),
    },
    {
      icon: "shuffle" as const,
      color: theme.transfer,
      label: t.transfer.title,
      animStyle: item3Style,
      onPress: () => closeMenu(() => router.push("/(modals)/transfer-form")),
    },
  ];

  const FabTabButton = () => (
    <Pressable
      onPress={isMenuOpen ? () => closeMenu() : openMenu}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: isIOS ? insets.bottom + 8 : isWeb ? 14 : 6,
        overflow: "visible",
      } as any}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: fabRise,
          ...(Platform.OS === "web"
            ? { boxShadow: `0 4px 16px rgba(47,143,131,0.50)` }
            : {
                shadowColor: "#2F8F83",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
                elevation: 10,
              }),
        } as any}
      >
        <Animated.View style={fabIconStyle}>
          <Feather name="plus" size={26} color="#fff" />
        </Animated.View>
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: isDark ? "#475569" : "#94A3B8",
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : theme.tabBar,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: theme.border,
            elevation: 0,
            overflow: "visible",
            ...(isWeb ? { height: 84 } : {}),
          } as any,
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.tabBar }]} />
            ) : null,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.tabs.dashboard,
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: t.tabs.transactions,
            tabBarIcon: ({ color, size }) => (
              <Feather name="repeat" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarShowLabel: false,
            tabBarButton: () => <FabTabButton />,
          }}
        />
        <Tabs.Screen
          name="savings"
          options={{
            title: t.tabs.savings,
            tabBarIcon: ({ color, size }) => (
              <Feather name="dollar-sign" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: t.tabs.statistics,
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: t.tabs.more,
            tabBarIcon: ({ color, size }) => (
              <Feather name="grid" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Backdrop */}
      {isMenuOpen && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            zIndex: 20,
          }}
          onPress={() => closeMenu()}
        />
      )}

      {/* Mini action menu */}
      {isMenuOpen && (
        <View
          style={{
            position: "absolute",
            bottom: tabBarH + insets.bottom + fabRise + 8,
            left: 0,
            right: 0,
            alignItems: "center",
            gap: 12,
            zIndex: 21,
            pointerEvents: "box-none",
          } as any}
        >
          {[...menuItems].reverse().map((item) => (
            <Animated.View key={item.label} style={item.animStyle}>
              <Pressable
                onPress={item.onPress}
                style={{
                  flexDirection: isRTL ? "row" : "row-reverse",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{item.label}</Text>
                </View>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: item.color,
                    alignItems: "center",
                    justifyContent: "center",
                    ...(Platform.OS === "web"
                      ? { boxShadow: `0 4px 12px ${item.color}60` }
                      : { shadowColor: item.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 8 }),
                  } as any}
                >
                  <Feather name={item.icon} size={20} color="#fff" />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

      <QuickAddSheet
        visible={qaVisible}
        initialType={qaType}
        onClose={() => setQaVisible(false)}
      />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
