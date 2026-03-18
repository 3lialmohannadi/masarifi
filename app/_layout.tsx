import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { VideoSplash } from "@/components/VideoSplash";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toast } from "@/components/Toast";
import { queryClient } from "@/services/api";
import { AppProvider, useApp } from "@/store/AppContext";
import { AuthProvider } from "@/store/AuthContext";
import { AccountsProvider } from "@/store/AccountsContext";
import { TransactionsProvider } from "@/store/TransactionsContext";
import { CategoriesProvider } from "@/store/CategoriesContext";
import { SavingsProvider } from "@/store/SavingsContext";
import { CommitmentsProvider } from "@/store/CommitmentsContext";
import { DebtsProvider } from "@/store/DebtsContext";
import { BudgetsProvider } from "@/store/BudgetsContext";

SplashScreen.preventAutoHideAsync();

function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isDark, settings } = useApp();
  const onboardingChecked = useRef(false);

  useEffect(() => {
    if (!isLoaded || onboardingChecked.current) return;
    onboardingChecked.current = true;
    if (!settings.onboarded) {
      router.replace("/onboarding");
    }
  }, [isLoaded, settings.onboarded]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F1E1C", alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#2F8F83" />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
      <Toast />
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AuthProvider>
      <AccountsProvider>
        <TransactionsProvider>
          <CategoriesProvider>
            <SavingsProvider>
              <CommitmentsProvider>
                <DebtsProvider>
                  <BudgetsProvider>
                    {children}
                  </BudgetsProvider>
                </DebtsProvider>
              </CommitmentsProvider>
            </SavingsProvider>
          </CategoriesProvider>
        </TransactionsProvider>
      </AccountsProvider>
      </AuthProvider>
    </AppProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/add-transaction"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/account-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/category-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/saving-wallet-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/commitment-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/transfer-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/transfer-detail"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/savings-movement"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen name="accounts/list" options={{ headerShown: false }} />
      <Stack.Screen name="accounts/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="savings/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="commitments/index" options={{ headerShown: false }} />
      <Stack.Screen name="commitments/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="categories/index" options={{ headerShown: false }} />
      <Stack.Screen name="debts/index" options={{ headerShown: false }} />
      <Stack.Screen name="debts/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/debt-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/debt-payment"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="profile/index" options={{ headerShown: false }} />
      <Stack.Screen name="contact-support" options={{ headerShown: false }} />
      <Stack.Screen name="report/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/budget-form"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [videoSplashDone, setVideoSplashDone] = useState(Platform.OS === "web");
  const hideAsyncCalledRef = useRef(false);

  // Set up foreground notification handler so local notifications are
  // shown even when the app is in the foreground (required for iOS).
  useEffect(() => {
    import("expo-notifications").then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }).catch(() => {});
  }, []);

  const handleSplashHide = useCallback(() => {
    if (!hideAsyncCalledRef.current) {
      hideAsyncCalledRef.current = true;
      SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      const fallback = setTimeout(handleSplashHide, 5000);
      return () => clearTimeout(fallback);
    }
  }, [fontsLoaded, fontError, handleSplashHide]);

  useEffect(() => {
    const emergency = setTimeout(handleSplashHide, 3000);
    return () => clearTimeout(emergency);
  }, [handleSplashHide]);

  const handleVideoFinish = useCallback(() => {
    setVideoSplashDone(true);
  }, []);

  if (!fontsLoaded && !fontError && Platform.OS !== "web") return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <Providers>
              {!videoSplashDone ? (
                <>
                  <StatusBar style="light" hidden />
                  <VideoSplash onFinish={handleVideoFinish} onReady={handleSplashHide} />
                </>
              ) : (
                <AppLoadingGate>
                  <RootLayoutNav />
                </AppLoadingGate>
              )}
            </Providers>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
