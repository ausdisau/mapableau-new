import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function CommunicationScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Communication
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Communication passport, AAC prompts, Easy Read and emergency card. Speech difficulty is never treated as reduced capacity.</Text>
    </ScrollView>
  );
}
