export const QUICK_OBSERVATION_TYPES = [
  "lift_unavailable",
  "ramp_blocked",
  "entrance_step_added",
  "door_blocked",
  "accessible_toilet_unavailable",
  "construction",
  "step_free_entrance",
  "other",
] as const;

export type QuickObservationType = (typeof QUICK_OBSERVATION_TYPES)[number];

export const QUICK_OBSERVATION_OPTIONS: {
  id: QuickObservationType;
  label: string;
  allowsYesNo?: boolean;
  question?: string;
}[] = [
  { id: "lift_unavailable", label: "Lift unavailable" },
  { id: "ramp_blocked", label: "Ramp blocked" },
  { id: "entrance_step_added", label: "Entrance step added" },
  { id: "door_blocked", label: "Door blocked" },
  { id: "accessible_toilet_unavailable", label: "Accessible toilet unavailable" },
  { id: "construction", label: "Construction" },
  {
    id: "step_free_entrance",
    label: "Entrance step-free check",
    allowsYesNo: true,
    question: "Was this entrance step-free?",
  },
  { id: "other", label: "Other change" },
];

export const QUICK_OBSERVATION_LABELS: Record<QuickObservationType, string> =
  Object.fromEntries(
    QUICK_OBSERVATION_OPTIONS.map((o) => [o.id, o.label]),
  ) as Record<QuickObservationType, string>;
