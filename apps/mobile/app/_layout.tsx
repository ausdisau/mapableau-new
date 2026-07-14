import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/auth/AuthContext";
import { AccessibilityPreferencesProvider } from "@/accessibility";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkBanner } from "@/components/NetworkBanner";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AccessibilityPreferencesProvider>
        <AuthProvider>
          <ErrorBoundary>
            <NetworkBanner />
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </ErrorBoundary>
        </AuthProvider>
      </AccessibilityPreferencesProvider>
    </SafeAreaProvider>
  );
}
