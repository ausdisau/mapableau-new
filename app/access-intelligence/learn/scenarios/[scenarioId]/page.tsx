import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { ScenarioPracticeWorkspace } from "@/components/access-intelligence/learning/scenario-practice-workspace";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getScenarioById } from "@/lib/access-intelligence/learning/scenarios";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}): Promise<Metadata> {
  const { scenarioId } = await params;
  const scenario = getScenarioById(scenarioId);
  return {
    title: scenario
      ? `${scenario.title} | Learning Lab`
      : "Scenario | Learning Lab",
  };
}

export default async function LearningScenarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { scenarioId } = await params;
  const { mode } = await searchParams;
  const scenario = getScenarioById(scenarioId);
  if (!scenario) notFound();

  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title={scenario.title}
        description={scenario.humanGoal}
      >
        <ScenarioPracticeWorkspace
          scenario={scenario}
          initialMode={mode === "guide_me" ? "guide_me" : "practice"}
        />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
