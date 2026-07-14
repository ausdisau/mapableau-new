import React from "react";
import { Tabs } from "expo-router";
import { DEFAULT_MOBILE_FEATURE_FLAGS } from "@mapable/feature-flags";
import { participantTabs } from "@/navigation/role-navigation";

export default function ParticipantLayout() {
  const tabs = participantTabs(DEFAULT_MOBILE_FEATURE_FLAGS);
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.key} name={tab.key} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
