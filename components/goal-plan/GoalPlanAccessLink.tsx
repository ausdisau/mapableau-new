"use client";

import Link from "next/link";

import type { GoalPlanDraft } from "@mapable/contracts";

import { applyJourneyOverride } from "@/lib/access/experience/exploration-state";
import {
  loadExplorationSession,
  saveExplorationSession,
} from "@/lib/access/experience/session-storage";
import { buildGoalPlanAccessJourneyOverride } from "@/lib/goal-plan/access-exploration-adapter";
import { isGoalPlanAccessHandoffEnabled } from "@/lib/goal-plan/flags";

export function GoalPlanAccessLink({ plan }: { plan: GoalPlanDraft }) {
  const accessCandidate = plan.serviceCandidates.find(
    (candidate) => candidate.module === "access",
  );

  if (
    !isGoalPlanAccessHandoffEnabled() ||
    accessCandidate?.decision !== "yes"
  ) {
    return null;
  }

  const prepareAccessSession = () => {
    const current = loadExplorationSession();
    const baseRequirements =
      current.savedRequirements ?? current.requirements;
    const override = buildGoalPlanAccessJourneyOverride({
      plan,
      baseRequirements,
    });

    if (!override) return;

    saveExplorationSession(
      applyJourneyOverride(current, override),
    );
  };

  return (
    <section
      aria-labelledby="goal-plan-access-handoff-heading"
      className="rounded-xl border border-[#005B7F]/20 bg-[#F6FBFC] p-4"
    >
      <h3
        id="goal-plan-access-handoff-heading"
        className="font-bold text-[#0C1833]"
      >
        Explore accessibility
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-700">
        Open MapAble Access with any explicit access features from this goal
        applied only to this exploration session. Your saved Access profile is
        not changed.
      </p>
      <Link
        href="/access"
        onClick={prepareAccessSession}
        className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-bold text-white hover:bg-[#004A66] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
      >
        Explore accessibility
      </Link>
    </section>
  );
}
