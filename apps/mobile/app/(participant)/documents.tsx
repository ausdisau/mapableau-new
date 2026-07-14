import React from "react";
import { ScrollView, Text } from "react-native";
export default function Page() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700" }}>Documents</Text>
      <Text>Manage documents with MapAble cloud authority controls.</Text>
    </ScrollView>
  );
}
