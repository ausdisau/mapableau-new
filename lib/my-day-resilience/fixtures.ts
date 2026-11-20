import type {
  ConsentSnapshot,
  MyDayPlan,
  PlanStep,
  SourceEvidence,
} from "@/lib/my-day-resilience/types";

/** Synthetic participant — Alex. No real personal data. */
export const SYNTHETIC_TENANT_ID = "tenant_synthetic_riverbend";
export const SYNTHETIC_PARTICIPANT_ID = "participant_synthetic_alex";
export const PREFERRED_WORKER_ID = "example-a";
export const SUBSTITUTE_WORKER_ID = "example-b";
export const RESTRICTED_WORKER_ID = "example-c";

export const DEFAULT_GOAL =
  "I want to attend work tomorrow, stop at the shops and return with my usual worker.";

export function createConsentSnapshot(granted: boolean): ConsentSnapshot {
  return {
    granted,
    purpose: "my_day_resilience_synthetic_demo",
    tenantId: SYNTHETIC_TENANT_ID,
    participantSyntheticId: SYNTHETIC_PARTICIPANT_ID,
    recordedAt: "2026-11-09T07:00:00.000Z",
  };
}

export function createAlexWorkShopsReturnPlan(
  overrides?: Partial<Pick<MyDayPlan, "goalStatement">>,
): MyDayPlan {
  const steps: PlanStep[] = [
    {
      id: "step_work",
      kind: "work",
      label: "Attend work at Riverbend Civic Hub",
      scheduledStart: "2026-11-10T09:00:00.000Z",
      scheduledEnd: "2026-11-10T12:00:00.000Z",
      destinationLabel: "Riverbend Civic Hub (fictional)",
      supportNeeded: true,
      preferredWorkerId: PREFERRED_WORKER_ID,
      transportRequired: true,
      communicationNeeds: ["aac", "extra_time"],
      mobilityNotes: "Wheelchair accessible vehicle preferred (declared).",
    },
    {
      id: "step_shops",
      kind: "shops",
      label: "Stop at the shops",
      scheduledStart: "2026-11-10T12:30:00.000Z",
      scheduledEnd: "2026-11-10T13:15:00.000Z",
      destinationLabel: "Riverbend Market (fictional)",
      supportNeeded: true,
      preferredWorkerId: PREFERRED_WORKER_ID,
      transportRequired: true,
      communicationNeeds: ["aac", "extra_time"],
    },
    {
      id: "step_return",
      kind: "return_home",
      label: "Return home with usual worker",
      scheduledStart: "2026-11-10T13:30:00.000Z",
      scheduledEnd: "2026-11-10T14:15:00.000Z",
      destinationLabel: "Home (synthetic location label only)",
      supportNeeded: true,
      preferredWorkerId: PREFERRED_WORKER_ID,
      transportRequired: true,
      communicationNeeds: ["aac", "extra_time"],
    },
  ];

  return {
    planId: "plan_alex_work_shops_return",
    tenantId: SYNTHETIC_TENANT_ID,
    participantSyntheticId: SYNTHETIC_PARTICIPANT_ID,
    goalStatement: overrides?.goalStatement ?? DEFAULT_GOAL,
    steps,
    dependencies: [
      {
        id: "dep_work_to_shops",
        fromStepId: "step_work",
        toStepId: "step_shops",
        relation: "timed_before",
        honesty: "declared",
      },
      {
        id: "dep_shops_to_return",
        fromStepId: "step_shops",
        toStepId: "step_return",
        relation: "timed_before",
        honesty: "declared",
      },
      {
        id: "dep_care_enables_work",
        fromStepId: "step_work",
        toStepId: "step_work",
        relation: "requires",
        honesty: "fictional",
      },
    ],
    synthetic: true,
    productionClaim: "none",
  };
}

export const ACCESS_OBSERVATIONS: SourceEvidence[] = [
  {
    id: "ev_entrance",
    topic: "Venue entrance",
    honesty: "fictional",
    summary:
      "Synthetic fixture: step-free western entrance listed for Riverbend Civic Hub. Not independently verified.",
    capabilityClaim: "in_development",
  },
  {
    id: "ev_lift",
    topic: "Internal lift",
    honesty: "unknown",
    summary:
      "Lift operational status for level access is unknown in this scenario. Do not treat as safe.",
    capabilityClaim: "in_development",
  },
  {
    id: "ev_path_shops",
    topic: "Path to shops",
    honesty: "declared",
    summary:
      "Participant declared a preferred kerb-cut path. Declaration is not independent verification.",
    capabilityClaim: "in_development",
  },
];

export const TRANSPORT_BASELINE_EVIDENCE: SourceEvidence[] = [
  {
    id: "ev_vehicle",
    topic: "Accessible vehicle",
    honesty: "declared",
    summary:
      "Proposed wheelchair-accessible vehicle with ramp (declared in scenario). Not booked.",
    capabilityClaim: "in_development",
  },
  {
    id: "ev_boarding",
    topic: "Boarding method",
    honesty: "declared",
    summary: "Ramp boarding with extra time (declared preference).",
    capabilityClaim: "in_development",
  },
];
