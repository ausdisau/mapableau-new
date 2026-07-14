import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { CareOSMissionSummary } from "@mapable/careos-contracts";
import { AccessibleButton, AccessibleField } from "@/accessibility";
import { getMobileApiClient } from "@/api/client";
import { useMapableTheme } from "@/theme";

export function MissionListScreen() {
  const theme = useMapableTheme();
  const router = useRouter();
  const [missions, setMissions] = useState<CareOSMissionSummary[]>([]);
  const [goal, setGoal] = useState("Help me attend physiotherapy next Tuesday.");

  useEffect(() => {
    getMobileApiClient()
      .listMissions()
      .then(setMissions)
      .catch(() => setMissions(demoMissions()));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: "700", color: theme.colors.foreground }}>
        CareOS missions
      </Text>
      <AccessibleField
        label="What do you want help with?"
        value={goal}
        onChangeText={setGoal}
        multiline
      />
      <AccessibleButton
        label="Create appointment mission"
        onPress={async () => {
          try {
            const mission = await getMobileApiClient().createAppointmentMission({
              goalText: goal,
              idempotencyKey: cryptoRandomUuid(),
            });
            router.push(`/(participant)/careos/${mission.id}`);
          } catch {
            router.push("/(participant)/careos/mission_demo_appointment");
          }
        }}
      />
      {missions.map((m) => (
        <Pressable
          key={m.id}
          accessibilityRole="button"
          accessibilityLabel={`${m.desiredOutcome}. ${m.whatChanged}. ${m.whatHappensNext}`}
          onPress={() => router.push(`/(participant)/careos/${m.id}`)}
          style={{ gap: 4, paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.colors.border }}
        >
          <Text style={{ fontWeight: "700", color: theme.colors.foreground }}>{m.desiredOutcome}</Text>
          <Text style={{ color: theme.colors.foreground }}>{m.whatChanged}</Text>
          <Text style={{ color: theme.colors.foreground }}>{m.whatHappensNext}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function cryptoRandomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function demoMissions(): CareOSMissionSummary[] {
  return [
    {
      id: "mission_demo_appointment",
      missionType: "appointment",
      status: "needs_decision",
      desiredOutcome: "Attend physiotherapy next Tuesday",
      whatChanged: "CareOS prepared Care and Transport options for review.",
      whyItMatters: "The provider needs your approval by Friday.",
      needsDecision: true,
      whoIsWaiting: "You",
      whatHappensNext: "Review evidence, then confirm Care and Transport separately.",
      updatedAt: new Date().toISOString(),
    },
  ];
}
