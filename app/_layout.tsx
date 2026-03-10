import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toast } from "@/components/Toast";
import { queryClient } from "@/services/api";
import { AppProvider, useApp } from "@/store/AppContext";
import { AccountsProvider } from "@/store/AccountsContext";
import { TransactionsProvider } from "@/store/TransactionsContext";
import { CategoriesProvider } from "@/store/CategoriesContext";
import { SavingsProvider } from "@/store/SavingsContext";
import { CommitmentsProvider } from "@/store/CommitmentsContext";
import { PlansProvider } from "@/store/PlansContext";
import { BudgetsProvider } from "@/store/BudgetsContext";

SplashScreen.preventAutoHideAsync();

function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isDark } = useApp();
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
      <AppLoadingGate>
        <AccountsProvider>
          <TransactionsProvider>
            <CategoriesProvider>
              <SavingsProvider>
                <CommitmentsProvider>
                  <PlansProvider>
                    <BudgetsProvider>{children}</BudgetsProvider>
                  </PlansProvider>
                </CommitmentsProvider>
              </SavingsProvider>
            </CategoriesProvider>
          </TransactionsProvider>
        </AccountsProvider>
      </AppLoadingGate>
    </AppProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
        name="(modals)/plan-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/plan-category-form"
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
        name="(modals)/budget-form"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="(modals)/savings-movement"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen name="accounts/list" options={{ headerShown: false }} />
      <Stack.Screen name="accounts/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="savings/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="plans/index" options={{ headerShown: false }} />
      <Stack.Screen name="plans/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="commitments/index" options={{ headerShown: false }} />
      <Stack.Screen name="commitments/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="budget/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="categories/index" options={{ headerShown: false }} />
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <Providers>
              <RootLayoutNav />
            </Providers>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
