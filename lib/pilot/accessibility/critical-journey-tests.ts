export type JourneyTest = {
  journey: string;
  steps: string[];
};

export const CRITICAL_PILOT_JOURNEYS: readonly JourneyTest[] = [
  {
    journey: "pilot_consent",
    steps: ["open_info_pack", "review_allowlists", "record_pilot_consent"],
  },
  {
    journey: "raise_complaint",
    steps: ["open_complaint", "optional_anonymous", "submit"],
  },
  {
    journey: "withdraw_consent",
    steps: ["open_enrolment", "withdraw", "confirm_exit"],
  },
];

export function listCriticalJourneyIds(): string[] {
  return CRITICAL_PILOT_JOURNEYS.map((j) => j.journey);
}
