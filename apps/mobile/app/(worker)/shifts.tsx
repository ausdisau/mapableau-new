import { Text, View } from "react-native";
export default function Page() {
  return (
    <View style={{ padding: 16 }}>
      <Text accessibilityRole="header">Shifts</Text>
      <Text>Worker companion module is feature-flagged (MAPABLE_MOBILE_WORKER_ENABLED).</Text>
    </View>
  );
}
