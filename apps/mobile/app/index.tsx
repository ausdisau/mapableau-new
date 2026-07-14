import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { AccessibleButton } from "@/accessibility";
import { useAuth } from "@/auth/AuthContext";
import { useMapableTheme } from "@/theme";
import { loadMobilePublicEnv } from "@/types/env";

export default function Index() {
  const auth = useAuth();
  const theme = useMapableTheme();
  const env = loadMobilePublicEnv();

  useEffect(() => {
    // Deep-link auth return handled by /(auth)/callback route.
  }, []);

  if (!auth.ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator accessibilityLabel="Starting MapAble" />
      </View>
    );
  }

  if (auth.authenticated && auth.biometricUnlockRequired) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: theme.colors.background }}>
        <Text accessibilityRole="header" style={{ fontSize: 32, fontWeight: "700", color: theme.colors.primary }}>
          MapAble
        </Text>
        <Text style={{ color: theme.colors.foreground }}>Unlock to continue.</Text>
        <AccessibleButton label="Unlock with biometrics" onPress={() => auth.unlockWithBiometrics()} />
        <AccessibleButton label="Sign out" onPress={() => auth.signOutCurrentDevice()} />
      </View>
    );
  }

  if (auth.authenticated) {
    return <Redirect href="/(participant)/today" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: theme.colors.background }}>
      <Text accessibilityRole="header" style={{ fontSize: 40, fontWeight: "700", color: theme.colors.primary }}>
        MapAble
      </Text>
      <Text style={{ color: theme.colors.foreground, fontSize: 18 }}>
        State your goals. Review what CareOS prepared. Confirm Care and Transport yourself.
      </Text>
      <AccessibleButton label="Sign in" onPress={() => auth.signIn()} />
      <Text style={{ color: theme.colors.foreground }}>Version {env.appVersion}</Text>
    </View>
  );
}
