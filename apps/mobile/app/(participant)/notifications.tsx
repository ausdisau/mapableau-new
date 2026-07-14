import React from "react";
import { ScrollView, Text } from "react-native";
export default function Page() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700" }}>Notifications</Text>
      <Text>Manage notifications with MapAble cloud authority controls.</Text>
    </ScrollView>
  );
}
