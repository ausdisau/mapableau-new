import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function MessagesScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Messages
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Mission and relationship threads with privacy-safe notifications.</Text>
    </ScrollView>
  );
}
