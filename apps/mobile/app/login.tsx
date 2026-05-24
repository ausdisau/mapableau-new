import { Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Sign in</Text>
      <Text style={{ marginTop: 8 }}>
        Wire to MapAble /api/auth endpoints with secure token storage.
      </Text>
    </View>
  );
}
