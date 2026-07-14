import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function WorkerTodayScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Worker Today
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Shift offers, communication passport, check-in/out and reviewed notes. Feature-flagged until security and offline tests pass.</Text>
    </ScrollView>
  );
}
