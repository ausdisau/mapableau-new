import type { DayActivity, DayPlan } from "./day-planner";

export const MAPABLE_DAY_SCENARIOS = [
  { id: "baseline", label: "Planned day" },
  { id: "worker_cancelled", label: "Worker cancels" },
  { id: "transport_issue", label: "Transport mismatch" },
  { id: "aac_unconfirmed", label: "Communication not confirmed" },
  { id: "no_verified_worker", label: "No verified worker" },
  { id: "no_backup", label: "No backup worker" },
  { id: "transport_cancelled", label: "Transport cancelled" },
  { id: "missing_return", label: "Missing return trip" },
  { id: "timing_conflict", label: "Timing conflict" },
  { id: "participant_declines_alternative", label: "Participant declines alternative" },
] as const;

export type MapAbleDayScenarioId = (typeof MAPABLE_DAY_SCENARIOS)[number]["id"];

const STARTING_ACTIVITIES: DayActivity[] = [
  {
    id: "morning-care",
    startTime: "08:00",
    endTime: "09:00",
    title: "Morning personal support",
    detail: "Example support shift. Worker details are fictional.",
    kind: "care",
    status: "confirmed",
    dependsOn: [],
    workerEvidence: "verified",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: true,
  },
  {
    id: "outbound-trip",
    startTime: "09:15",
    endTime: "09:45",
    title: "Accessible transport to appointment",
    detail: "Pickup depends on the morning support arrangement.",
    kind: "transport",
    status: "confirmed",
    dependsOn: ["morning-care"],
    workerEvidence: "not_applicable",
    vehicleEvidence: "compatible",
    requiresAACAcknowledgement: false,
  },
  {
    id: "appointment",
    startTime: "10:00",
    endTime: "11:00",
    title: "Allied-health appointment",
    detail: "The appointment depends on suitable transport arriving.",
    kind: "appointment",
    status: "confirmed",
    dependsOn: ["outbound-trip"],
    workerEvidence: "not_applicable",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
  {
    id: "return-trip",
    startTime: "11:15",
    endTime: "11:45",
    title: "Return transport",
    detail: "Return arrangements depend on the appointment.",
    kind: "transport",
    status: "confirmed",
    dependsOn: ["appointment"],
    workerEvidence: "not_applicable",
    vehicleEvidence: "compatible",
    requiresAACAcknowledgement: false,
  },
  {
    id: "lunch",
    startTime: "12:30",
    endTime: "13:00",
    title: "Lunch and personal time",
    detail: "A personal routine, not a worker assignment.",
    kind: "personal",
    status: "confirmed",
    dependsOn: [],
    workerEvidence: "not_applicable",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
  {
    id: "community",
    startTime: "14:00",
    endTime: "15:00",
    title: "Community participation",
    detail: "An optional local activity. Time and access are still to be checked.",
    kind: "participation",
    status: "pending",
    dependsOn: [],
    workerEvidence: "not_applicable",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
  {
    id: "evening-care",
    startTime: "17:30",
    endTime: "18:00",
    title: "Evening support check-in",
    detail: "Example separate support shift.",
    kind: "care",
    status: "confirmed",
    dependsOn: [],
    workerEvidence: "verified",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
];

const scenarioDescriptions: Record<MapAbleDayScenarioId, string> = {
  baseline:
    "A typical example day with one participation activity still awaiting confirmation.",
  worker_cancelled:
    "The morning worker cancels. Dependent transport and appointment activities become blocked until the person chooses what to do.",
  transport_issue:
    "A proposed vehicle does not meet access requirements. Later activities cannot be marked ready.",
  aac_unconfirmed:
    "The morning worker has not acknowledged the participant's required communication method.",
  no_verified_worker:
    "No eligible backup worker is verified. The system must escalate, not invent a match.",
  no_backup:
    "Morning care is cancelled and no backup worker is verified. Downstream stays blocked; no silent substitution.",
  transport_cancelled:
    "Outbound transport was cancelled. Dependent appointment and return become blocked.",
  missing_return:
    "Return transport is missing from the plan. Downstream evening care remains independent.",
  timing_conflict:
    "Outbound transport begins before morning care ends — requires human review.",
  participant_declines_alternative:
    "A recovery alternative was offered and declined. Activities stay blocked; no auto-rebook.",
};

/** No real participant, worker, transport, health or location data. */
export function makeSyntheticDayPlan(scenarioId: MapAbleDayScenarioId): DayPlan {
  const activities = STARTING_ACTIVITIES.map((item) => ({
    ...item,
    dependsOn: [...item.dependsOn],
  }));
  const morning = activities.find((item) => item.id === "morning-care");
  const outbound = activities.find((item) => item.id === "outbound-trip");
  const returnTrip = activities.find((item) => item.id === "return-trip");

  if (scenarioId === "worker_cancelled" && morning) morning.status = "cancelled";
  if (scenarioId === "transport_issue" && outbound) {
    outbound.vehicleEvidence = "incompatible";
  }
  if (scenarioId === "no_verified_worker" && morning) {
    morning.status = "unknown";
    morning.workerEvidence = "unverified";
  }
  if (scenarioId === "no_backup" && morning) {
    morning.status = "cancelled";
    morning.workerEvidence = "unverified";
  }
  if (scenarioId === "transport_cancelled" && outbound) {
    outbound.status = "cancelled";
  }
  if (scenarioId === "missing_return" && returnTrip) {
    returnTrip.status = "unknown";
    returnTrip.vehicleEvidence = "unknown";
    returnTrip.detail =
      "Return trip is not present on authorised records. Do not invent one.";
  }
  if (scenarioId === "timing_conflict" && outbound) {
    outbound.startTime = "08:45";
    outbound.endTime = "09:15";
  }
  if (scenarioId === "participant_declines_alternative" && morning) {
    morning.status = "cancelled";
    morning.detail =
      "Participant declined the proposed alternative. No automatic rebooking.";
  }

  return {
    scenarioId,
    description: scenarioDescriptions[scenarioId],
    activities,
    communication: {
      preferredMode: "Text and AAC, with adequate response time",
      workerAcknowledged: scenarioId !== "aac_unconfirmed",
    },
    participantControls: {
      changeApprovalRequired: true,
      delegationNotAssumed: true,
      sharingNotGrantedByDefault: true,
    },
    dataSource: "synthetic",
  };
}

/** Synthetic morning routine — not a clinical record. */
export type SyntheticRoutineStep = {
  id: string;
  label: string;
  estimatedMinutes: number;
  optional: boolean;
};

export function makeSyntheticMorningRoutine(): SyntheticRoutineStep[] {
  return [
    { id: "wake", label: "Wake and settle", estimatedMinutes: 10, optional: false },
    { id: "meds", label: "Morning medications (participant-led)", estimatedMinutes: 5, optional: true },
    { id: "breakfast", label: "Breakfast", estimatedMinutes: 20, optional: false },
    { id: "ready", label: "Get ready for support visit", estimatedMinutes: 15, optional: false },
  ];
}

/** Synthetic handover bundle — never real plans. */
export function makeSyntheticHandoverPreview() {
  return {
    label: "Synthetic worker view",
    disclosure:
      "This is a demonstration only. No real participant plans, health details, or credentials are shown.",
    permissions: [
      { id: "today-schedule", label: "Today's confirmed activities", granted: true },
      { id: "communication", label: "Preferred communication mode", granted: true },
      { id: "clinical-notes", label: "Clinical notes", granted: false },
      { id: "family-feed", label: "Family updates feed", granted: false },
      { id: "qr-access", label: "QR door access", granted: false },
    ],
  };
}
