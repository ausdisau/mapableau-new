import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function CareScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Care
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Review Care requests, worker options with evidence, and confirm separately from Transport. MapAble never auto-assigns a worker or ranks with a hidden score.</Text>
    </ScrollView>
  );
}
