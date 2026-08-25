import type {
  AccessCompatibilityState,
  AccessCriticality,
  AccessDisclosureScope,
  AccessDomain,
} from "./domains";

export type CommonAccessConcept = {
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  label: string;
  defaultComparator?: "eq" | "gte";
  defaultValue?: string | number | boolean;
  unit?: string;
};

/** Catalog of participant-facing access needs for My Access and label resolution. */
export const COMMON_ACCESS_CONCEPTS: CommonAccessConcept[] = [
  {
    ontologyConceptId: "mobility_movement.step_free",
    domain: "mobility_movement",
    attribute: "step_free",
    label: "Step-free access",
    defaultValue: true,
  },
  {
    ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
    domain: "mobility_movement",
    attribute: "minimum_clear_width_mm",
    label: "Minimum clear width (mm)",
    defaultComparator: "gte",
    defaultValue: 850,
    unit: "mm",
  },
  {
    ontologyConceptId: "hearing.hearing_augmentation",
    domain: "hearing",
    attribute: "hearing_augmentation",
    label: "Hearing augmentation",
    defaultValue: true,
  },
  {
    ontologyConceptId: "self_care_continence.accessible_toilet",
    domain: "self_care_continence",
    attribute: "accessible_toilet",
    label: "Accessible toilet",
    defaultValue: true,
  },
  {
    ontologyConceptId: "sensory_regulation.quiet_space",
    domain: "sensory_regulation",
    attribute: "quiet_space",
    label: "Quiet space available",
    defaultValue: true,
  },
  {
    ontologyConceptId: "speech_communication.text_fallback",
    domain: "speech_communication",
    attribute: "text_fallback",
    label: "Text communication option",
    defaultValue: true,
  },
  {
    ontologyConceptId: "transport.accessible_vehicle",
    domain: "transport",
    attribute: "accessible_vehicle",
    label: "Accessible vehicle",
    defaultValue: true,
  },
  {
    ontologyConceptId: "emergency.accessible_exit_information",
    domain: "emergency",
    attribute: "accessible_exit_information",
    label: "Accessible exit information",
    defaultValue: true,
  },
];

/** First-run checklist: three common needs for empty passports. */
export const FIRST_RUN_CONCEPT_IDS = [
  "mobility_movement.step_free",
  "hearing.hearing_augmentation",
  "self_care_continence.accessible_toilet",
] as const;

const CONCEPT_LABEL_BY_ID = new Map(
  COMMON_ACCESS_CONCEPTS.map((c) => [c.ontologyConceptId, c.label]),
);

export function labelForConceptId(ontologyConceptId: string): string {
  const known = CONCEPT_LABEL_BY_ID.get(ontologyConceptId);
  if (known) return known;
  const leaf = ontologyConceptId.includes(".")
    ? ontologyConceptId.slice(ontologyConceptId.lastIndexOf(".") + 1)
    : ontologyConceptId;
  return leaf
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const CRITICALITY_LABELS: Record<AccessCriticality, string> = {
  required: "Must have",
  strong_preference: "Strong preference",
  preference: "Preference",
};

export type PassportVisibilityDefault =
  | "private"
  | "request_scoped"
  | "approved_service";

export const VISIBILITY_LABELS: Record<PassportVisibilityDefault, string> = {
  private: "Private",
  request_scoped: "Share when I approve",
  approved_service: "Approved services",
};

export const DISCLOSURE_SCOPE_LABELS: Record<AccessDisclosureScope, string> = {
  private: "Private",
  service_provider: "Service provider",
  worker: "Support worker",
  employer: "Employer",
  venue: "Venue",
  transport_provider: "Transport provider",
  emergency: "Emergency services",
  support_coordinator: "Support coordinator",
};

export const COMPATIBILITY_STATUS_WORDS: Record<
  AccessCompatibilityState,
  string
> = {
  compatible: "Compatible",
  compatible_with_adjustment: "Needs adjustment",
  uncertain: "Unknown",
  incompatible: "Mismatch",
};

export const COMPATIBILITY_STATUS_DETAIL: Record<
  AccessCompatibilityState,
  string
> = {
  compatible: "Looks compatible with your stated needs",
  compatible_with_adjustment: "May work with an adjustment",
  uncertain: "We do not know enough yet",
  incompatible: "Known mismatch with a required need",
};

export const PLACE_COMPAT_PRIVACY_CTA =
  "Opening My Access does not share your needs with this place until you choose to.";
