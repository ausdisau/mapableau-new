import { Text, View } from "react-native";
export default function Page() {
  return (
    <View style={{ padding: 16 }}>
      <Text accessibilityRole="header">Reviews</Text>
      <Text>Coordinator mode is feature-flagged (MAPABLE_MOBILE_COORDINATOR_ENABLED).</Text>
    </View>
  );
}
