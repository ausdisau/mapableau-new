import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function AccessScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Access
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Search places with map and list modes. Evidence keeps provenance distinct. Community ratings are never presented as legal accessibility certification.</Text>
    </ScrollView>
  );
}
