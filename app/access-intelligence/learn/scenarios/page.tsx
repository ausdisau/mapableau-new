import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { listPublishedScenarios } from "@/lib/access-intelligence/learning/scenarios";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata: Metadata = {
  title: "Learning scenarios | Access Intelligence",
  description: "Practice branching access-reasoning scenarios.",
};

export default async function LearningScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "guide_me" ? "guide_me" : "practice";
  const scenarios = listPublishedScenarios();

  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title={mode === "guide_me" ? "Guide Me scenarios" : "Practice scenarios"}
        description="Each scenario includes a human goal, requirements, verified and unverified evidence, unknowns, decision points, teach-back, reflection, and transfer."
      >
        <ul className="space-y-3">
          {scenarios.map((s) => (
            <li key={s.id}>
              <a
                href={`/access-intelligence/learn/scenarios/${s.id}${mode === "guide_me" ? "?mode=guide_me" : ""}`}
                className={`block rounded-xl border border-slate-200 px-4 py-4 hover:border-[#005B7F] ${mapableCareFocusRing}`}
              >
                <span className="text-lg font-black">{s.title}</span>
                <span className="mt-1 block text-slate-600">{s.humanGoal}</span>
                <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {s.audience.join(" · ")} · v{s.version}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
