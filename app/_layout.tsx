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
import { queryClient } from "@/lib/query-client";
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
      <View style={{ flex: 1, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppLoadingGate>
        <AccountsProvider>
          <TransactionsProvider>
            <InnerProviders>{children}</InnerProviders>
          </TransactionsProvider>
        </AccountsProvider>
      </AppLoadingGate>
    </AppProvider>
  );
}

function InnerProviders({ children }: { children: React.ReactNode }) {
  const [txCategoryIds, setTxCategoryIds] = React.useState<string[]>([]);

  return (
    <TransactionsCategoryBridge onCategoryIds={setTxCategoryIds}>
      <CategoriesProvider transactionCategoryIds={txCategoryIds}>
        <SavingsProvider>
          <CommitmentsProvider>
            <PlansProvider>
              <BudgetsProvider>{children}</BudgetsProvider>
            </PlansProvider>
          </CommitmentsProvider>
        </SavingsProvider>
      </CategoriesProvider>
    </TransactionsCategoryBridge>
  );
}

function TransactionsCategoryBridge({
  children,
  onCategoryIds,
}: {
  children: React.ReactNode;
  onCategoryIds: (ids: string[]) => void;
}) {
  const { useTransactions } = require("@/store/TransactionsContext");
  const { categoryIdsInUse } = useTransactions();

  React.useEffect(() => {
    onCategoryIds(categoryIdsInUse);
  }, [categoryIdsInUse]);

  return <>{children}</>;
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
        name="(modals)/transfer-form"
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
      <Stack.Screen name="plans/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="commitments/index" options={{ headerShown: false }} />
      <Stack.Screen name="budget/index" options={{ headerShown: false }} />
      <Stack.Screen name="statistics/index" options={{ headerShown: false }} />
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
