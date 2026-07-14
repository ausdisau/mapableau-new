import type { CareOSMission } from "@prisma/client";

export function mapMissionSummary(mission: {
  id: string;
  missionType: string;
  status: string;
  desiredOutcome?: string | null;
  updatedAt: Date;
  createdAt: Date;
}) {
  const desiredOutcome =
    mission.desiredOutcome?.trim() || "CareOS mission needs your review";
  return {
    id: mission.id,
    missionType: normalizeMissionType(mission.missionType),
    status: normalizeStatus(mission.status),
    desiredOutcome,
    whatChanged: "Mission state updated in CareOS.",
    whyItMatters: "Your Care or Transport arrangements may need a decision.",
    needsDecision: ["proposed", "awaiting_confirmation", "blocked"].includes(
      mission.status,
    ),
    whoIsWaiting: "You",
    whatHappensNext:
      "Open the mission to review evidence and confirm actions separately.",
    updatedAt: (mission.updatedAt ?? mission.createdAt).toISOString(),
  };
}

function normalizeMissionType(value: string) {
  const allowed = new Set([
    "appointment",
    "care",
    "transport",
    "coordination",
    "continuity_recovery",
    "other",
  ]);
  return allowed.has(value) ? value : "other";
}

function normalizeStatus(value: string) {
  const map: Record<string, string> = {
    draft: "needs_decision",
    proposed: "needs_decision",
    awaiting_confirmation: "needs_decision",
    blocked: "recovery_required",
    confirmed: "confirmed",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
  };
  return map[value] ?? "needs_decision";
}

export function mapMissionDetail(mission: CareOSMission) {
  const summary = mapMissionSummary({
    id: mission.id,
    missionType: mission.missionType,
    status: mission.status,
    desiredOutcome: mission.desiredOutcome,
    updatedAt: mission.updatedAt,
    createdAt: mission.createdAt,
  });
  return {
    ...summary,
    authoritySummary:
      "Participant authority is required for Care and Transport confirmation. Organisation membership alone is not enough.",
    unknownInformation: [] as string[],
    recommendations: [] as string[],
    humanReviewItems: [] as string[],
    evidence: [] as Array<{
      id: string;
      label: string;
      provenance: string;
      observedAt: string | null;
      confidence: string;
      summary: string;
    }>,
    uncertainties: [] as Array<{
      id: string;
      description: string;
      impact: string;
    }>,
    pendingConfirmations: [
      {
        id: `care_${mission.id}`,
        domain: "care" as const,
        label: "Confirm Care support",
        status: "required" as const,
        explanation:
          "Care executes only after your explicit confirmation. Free-form model output cannot execute this action.",
      },
      {
        id: `transport_${mission.id}`,
        domain: "transport" as const,
        label: "Confirm accessible Transport",
        status: "required" as const,
        explanation:
          "Transport confirmation is separate from Care and tracks vehicle, driver, pickup access, route, destination and return trip distinctly.",
      },
    ],
    receipts: [] as Array<{
      id: string;
      domain: "care" | "transport" | "other";
      action: string;
      confirmedAt: string;
      correlationId: string;
    }>,
    dependencyLabels: ["Care confirmation", "Transport confirmation"],
    nonAiPathwayAvailable: true,
    appointment:
      mission.missionType === "appointment"
        ? {
            title: summary.desiredOutcome,
            startsAt: null as string | null,
            locationLabel: null as string | null,
            careRequirements: [] as string[],
            transportOptionsSummary: [] as string[],
            accessEvidenceSummary: [] as string[],
            timingBuffers: [] as string[],
            costContext: null as string | null,
          }
        : null,
  };
}
