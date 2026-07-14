import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function JobsScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Jobs
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Employment goals and accessible job discovery. No employability scores, automatic rejection, or disclosure without consent.</Text>
    </ScrollView>
  );
}
