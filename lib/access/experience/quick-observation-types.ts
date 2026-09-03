export const QUICK_OBSERVATION_TYPES = [
  "lift_unavailable",
  "ramp_blocked",
  "entrance_changed",
  "door_blocked",
  "accessible_toilet_unavailable",
  "construction",
  "kerb_ramp_missing",
  "path_narrow",
  "poor_surface",
  "crossing_concern",
  "entrance_step_added",
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
  { id: "entrance_changed", label: "Entrance changed" },
  { id: "door_blocked", label: "Door obstructed" },
  { id: "accessible_toilet_unavailable", label: "Toilet unavailable" },
  { id: "construction", label: "Construction" },
  { id: "kerb_ramp_missing", label: "Missing kerb ramp" },
  { id: "path_narrow", label: "Narrow path" },
  { id: "poor_surface", label: "Poor surface" },
  { id: "crossing_concern", label: "Crossing concern" },
  { id: "entrance_step_added", label: "Entrance step added" },
  {
    id: "step_free_entrance",
    label: "Entrance step-free check",
    allowsYesNo: true,
    question: "Was this entrance step-free?",
  },
  { id: "other", label: "Other" },
];

export const QUICK_OBSERVATION_LABELS: Record<QuickObservationType, string> =
  Object.fromEntries(
    QUICK_OBSERVATION_OPTIONS.map((o) => [o.id, o.label]),
  ) as Record<QuickObservationType, string>;
