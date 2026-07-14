import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { TodayItem } from "@mapable/api-client";
import { AccessibleStatus } from "@/accessibility";
import { getMobileApiClient } from "@/api/client";
import { useMapableTheme } from "@/theme";

export function TodayScreen() {
  const theme = useMapableTheme();
  const [items, setItems] = useState<TodayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = await getMobileApiClient().getToday();
        if (!cancelled) setItems(today.items);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load Today");
          setItems(demoTodayItems());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator accessibilityLabel="Loading Today" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
    >
      <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: "700", color: theme.colors.foreground }}>
        Today
      </Text>
      <Text style={{ color: theme.colors.foreground }}>
        What changed, what matters, and what you may need to decide.
      </Text>
      {error ? <AccessibleStatus label="Showing saved summary" tone="offline or delayed" /> : null}
      {items.map((item) => (
        <View
          key={item.id}
          accessible
          accessibilityLabel={`${item.title}. ${item.whatChanged}. ${item.whyItMatters}. ${
            item.needsDecision ? "You need to decide." : "No decision needed now."
          } Next: ${item.whatHappensNext}`}
          style={{
            gap: 6,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text style={{ fontWeight: "700", color: theme.colors.foreground }}>{item.title}</Text>
          <Text style={{ color: theme.colors.foreground }}>What changed: {item.whatChanged}</Text>
          <Text style={{ color: theme.colors.foreground }}>Why it matters: {item.whyItMatters}</Text>
          <Text style={{ color: theme.colors.foreground }}>
            {item.needsDecision ? "You need to decide." : "No decision needed now."}
          </Text>
          {item.whoIsWaiting ? (
            <Text style={{ color: theme.colors.foreground }}>Waiting: {item.whoIsWaiting}</Text>
          ) : null}
          <Text style={{ color: theme.colors.foreground }}>Next: {item.whatHappensNext}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function demoTodayItems(): TodayItem[] {
  return [
    {
      id: "care-1",
      kind: "care_shift",
      title: "Afternoon Care shift",
      whatChanged: "No worker has accepted this shift.",
      whyItMatters: "Your Care support for 3:00 pm is not confirmed yet.",
      needsDecision: true,
      whoIsWaiting: "You",
      whatHappensNext: "Review worker options or ask for human help.",
      href: "/(participant)/care",
    },
    {
      id: "trip-1",
      kind: "transport_pickup",
      title: "Return trip",
      whatChanged: "Your return trip has not been confirmed.",
      whyItMatters: "Without a return trip you may be stranded after physiotherapy.",
      needsDecision: true,
      whoIsWaiting: "Transport operator",
      whatHappensNext: "Review Transport options and confirm separately from Care.",
      href: "/(participant)/transport",
    },
  ];
}
