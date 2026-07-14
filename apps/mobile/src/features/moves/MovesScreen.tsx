import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function MovesScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Moves
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Clinician-authored plan summaries and accessible activity instructions. The app does not diagnose, prescribe or change intensity.</Text>
    </ScrollView>
  );
}
