import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { DEFAULT_MOBILE_FEATURE_FLAGS } from "@mapable/feature-flags";
import { participantMoreLinks } from "@/navigation/role-navigation";
import { useMapableTheme } from "@/theme";

export default function MorePage() {
  const theme = useMapableTheme();
  const router = useRouter();
  const links = participantMoreLinks(DEFAULT_MOBILE_FEATURE_FLAGS);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700" }}>More</Text>
      {links.map((link) => (
        <Pressable
          key={link.key}
          accessibilityRole="link"
          accessibilityLabel={link.title}
          onPress={() => router.push(link.href as never)}
          style={{ minHeight: 48, justifyContent: "center", borderBottomWidth: 1, borderColor: theme.colors.border }}
        >
          <Text style={{ fontSize: 18 }}>{link.title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
