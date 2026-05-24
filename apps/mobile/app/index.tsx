import { Text, View, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>MapAble</Text>
      <Text>Mobile shell — uses MapAble API routes; business logic stays on the server.</Text>
      <Link href="/login" asChild>
        <Pressable
          style={{
            minHeight: 48,
            backgroundColor: "#2563eb",
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>Login</Text>
        </Pressable>
      </Link>
    </View>
  );
}
