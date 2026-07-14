import React from "react";
import { ScrollView, Text } from "react-native";
import { useMapableTheme } from "@/theme";

export function TransportScreen() {
  const theme = useMapableTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        Accessible Transport
      </Text>
      <Text style={{ color: theme.colors.foreground, lineHeight: 22 }}>Pickup, destination, mobility device, vehicle, driver assistance, companions and assistance animals are shown as separate states. A non-map itinerary is always available.</Text>
    </ScrollView>
  );
}
