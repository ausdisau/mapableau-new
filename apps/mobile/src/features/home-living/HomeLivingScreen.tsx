import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function HomeLivingScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Home and Living
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Preferences, property options and support-model proposals for your review. The app does not select a property or provider automatically.</Text>
    </ScrollView>
  );
}
