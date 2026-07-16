/**
 * Fictional Pilot & Evaluation Console data.
 * All metrics are synthetic — never claim research validity.
 */

export type PilotOrg = {
  id: string;
  name: string;
  type: string;
};

export type PilotCohort = {
  id: string;
  name: string;
  size: number;
  consentComplete: number;
  scenarioIds: string[];
};

export type JourneyOutcomeRecord = {
  id: string;
  cohortId: string;
  placeId: string;
  predictedStatus: string;
  observedStatus: string;
  abandoned: boolean;
  planningMinutes: number;
  venueContacts: number;
  reportedConfidence: number;
  synthetic: true;
};

export type PilotSafetyGate = {
  id: string;
  label: string;
  status: "pass" | "fail" | "not_observed";
  note: string;
};

export type PilotSummary = {
  id: string;
  name: string;
  status: "draft" | "active" | "closed";
  fictionalWarning: string;
  organisations: PilotOrg[];
  venues: string[];
  cohorts: PilotCohort[];
  journeys: JourneyOutcomeRecord[];
  learning: {
    unknownVsAbsentAccuracy: number;
    routeRevisionAfterIncident: number;
    teachBackCompleteness: number;
    transferSuccess: number;
  };
  evidenceQuality: {
    hardRequirementAccuracy: number;
    unknownPreservation: number;
    evidenceCompleteness: number;
    liveStateFreshnessHours: number;
  };
  venueOps: {
    evidenceGapsResolved: number;
    averageClaimAgeDays: number;
    incidentResolutionHours: number;
    temporaryRoutePublishMinutes: number;
  };
  safetyGates: PilotSafetyGate[];
};

const FICTIONAL_WARNING =
  "All pilot metrics and cohorts are synthetic demonstration data. Do not claim research validity, population outcomes, or regulatory approval from this console.";

export const DEMO_PILOT: PilotSummary = {
  id: "pilot-harbour-demo-2026",
  name: "Harbour Access Intelligence Demonstration Pilot (fictional)",
  status: "active",
  fictionalWarning: FICTIONAL_WARNING,
  organisations: [
    { id: "org-demo-council", name: "Demo Harbour Council", type: "council" },
    { id: "org-demo-employer", name: "Synthetic Quays Employer Network", type: "employer" },
  ],
  venues: ["place-harbour-civic", "place-riverside-hall", "place-northside-library"],
  cohorts: [
    {
      id: "cohort-planners",
      name: "Access planners (synthetic)",
      size: 12,
      consentComplete: 12,
      scenarioIds: ["interview-level-3"],
    },
    {
      id: "cohort-venue-staff",
      name: "Venue staff learners (synthetic)",
      size: 8,
      consentComplete: 7,
      scenarioIds: ["interview-level-3"],
    },
  ],
  journeys: [
    {
      id: "j1",
      cohortId: "cohort-planners",
      placeId: "place-harbour-civic",
      predictedStatus: "suitable_with_conditions",
      observedStatus: "suitable_with_conditions",
      abandoned: false,
      planningMinutes: 14,
      venueContacts: 1,
      reportedConfidence: 68,
      synthetic: true,
    },
    {
      id: "j2",
      cohortId: "cohort-planners",
      placeId: "place-harbour-civic",
      predictedStatus: "suitable",
      observedStatus: "unknown",
      abandoned: false,
      planningMinutes: 22,
      venueContacts: 2,
      reportedConfidence: 41,
      synthetic: true,
    },
    {
      id: "j3",
      cohortId: "cohort-venue-staff",
      placeId: "place-northside-library",
      predictedStatus: "suitable_with_conditions",
      observedStatus: "suitable_with_conditions",
      abandoned: false,
      planningMinutes: 11,
      venueContacts: 0,
      reportedConfidence: 74,
      synthetic: true,
    },
  ],
  learning: {
    unknownVsAbsentAccuracy: 0.82,
    routeRevisionAfterIncident: 0.91,
    teachBackCompleteness: 0.76,
    transferSuccess: 0.7,
  },
  evidenceQuality: {
    hardRequirementAccuracy: 0.94,
    unknownPreservation: 1,
    evidenceCompleteness: 0.71,
    liveStateFreshnessHours: 6,
  },
  venueOps: {
    evidenceGapsResolved: 4,
    averageClaimAgeDays: 48,
    incidentResolutionHours: 5,
    temporaryRoutePublishMinutes: 18,
  },
  safetyGates: [
    {
      id: "gate-no-unauth-share",
      label: "Zero unauthorised sharing",
      status: "pass",
      note: "No sensitive write observed without approval in demo traces.",
    },
    {
      id: "gate-no-model-override",
      label: "Zero model overrides of deterministic blockers",
      status: "pass",
      note: "Fit/route engines remain authoritative.",
    },
    {
      id: "gate-no-weaken",
      label: "Zero weakening of required constraints",
      status: "pass",
      note: "Hard requirements not softened by narration.",
    },
    {
      id: "gate-approval",
      label: "No sensitive action without approval",
      status: "pass",
      note: "Verification and barrier tools require approval.",
    },
    {
      id: "gate-audit",
      label: "Audit coverage for sensitive actions",
      status: "pass",
      note: "Demo audit events recorded for verified writes.",
    },
  ],
};

export function listPilots(): PilotSummary[] {
  return [DEMO_PILOT];
}

export function getPilot(pilotId: string): PilotSummary | null {
  return listPilots().find((p) => p.id === pilotId) ?? null;
}

/** De-identified export — no emails, names, or passport fields. */
export function exportPilotDataset(pilotId: string): {
  pilotId: string;
  exportedAt: string;
  fictionalWarning: string;
  journeys: Array<{
    id: string;
    predictedStatus: string;
    observedStatus: string;
    abandoned: boolean;
    planningMinutes: number;
    venueContacts: number;
    reportedConfidence: number;
  }>;
  learning: PilotSummary["learning"];
  evidenceQuality: PilotSummary["evidenceQuality"];
  safetyGates: PilotSafetyGate[];
} | null {
  const pilot = getPilot(pilotId);
  if (!pilot) return null;
  return {
    pilotId: pilot.id,
    exportedAt: new Date().toISOString(),
    fictionalWarning: pilot.fictionalWarning,
    journeys: pilot.journeys.map((j) => ({
      id: j.id,
      predictedStatus: j.predictedStatus,
      observedStatus: j.observedStatus,
      abandoned: j.abandoned,
      planningMinutes: j.planningMinutes,
      venueContacts: j.venueContacts,
      reportedConfidence: j.reportedConfidence,
    })),
    learning: pilot.learning,
    evidenceQuality: pilot.evidenceQuality,
    safetyGates: pilot.safetyGates,
  };
}
