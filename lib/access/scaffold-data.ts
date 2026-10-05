export type ScaffoldAccessState = "MEETS" | "DOES_NOT_MATCH" | "UNKNOWN";
export type ScaffoldEvidenceState =
  | "VERIFIED"
  | "AUTHORITATIVE_SOURCE"
  | "COMMUNITY_REPORTED"
  | "UNKNOWN";

export type ScaffoldRequirementKey =
  | "stepFree"
  | "accessibleToilet"
  | "lift"
  | "quietSpace"
  | "hearingSupport"
  | "assistanceAnimal";

export interface ScaffoldPlace {
  id: string;
  name: string;
  category: string;
  suburb: string;
  city: string;
  state: string;
  summary: string;
  evidenceState: ScaffoldEvidenceState;
  evidenceLabel: string;
  evidenceNote: string;
  updatedLabel: string;
  mapPosition: { x: number; y: number };
  requirements: Record<ScaffoldRequirementKey, ScaffoldAccessState>;
}

export const SCAFFOLD_REQUIREMENTS: Array<{
  key: ScaffoldRequirementKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "stepFree", label: "Step-free entrance", shortLabel: "Step-free" },
  { key: "accessibleToilet", label: "Accessible toilet", shortLabel: "Toilet" },
  { key: "lift", label: "Lift access where needed", shortLabel: "Lift" },
  { key: "quietSpace", label: "Quiet or low-sensory space", shortLabel: "Quiet" },
  { key: "hearingSupport", label: "Hearing support or captions", shortLabel: "Hearing" },
  { key: "assistanceAnimal", label: "Assistance animal welcome", shortLabel: "Animal" },
];

export const SCAFFOLD_CITIES = [
  "All cities",
  "Sydney",
  "Melbourne",
  "Brisbane",
  "Adelaide",
  "Perth",
  "Hobart",
  "Darwin",
  "Canberra",
] as const;

export const SCAFFOLD_PLACES: ScaffoldPlace[] = [
  {
    id: "sydney-library",
    name: "Harbour Community Library",
    category: "Library",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    summary:
      "Step-free public entry, accessible toilet and staff-assisted quiet room access.",
    evidenceState: "AUTHORITATIVE_SOURCE",
    evidenceLabel: "Authoritative source",
    evidenceNote: "Venue-published access information with recent community confirmation.",
    updatedLabel: "Updated 12 Sep 2026",
    mapPosition: { x: 64, y: 36 },
    requirements: {
      stepFree: "MEETS",
      accessibleToilet: "MEETS",
      lift: "MEETS",
      quietSpace: "MEETS",
      hearingSupport: "UNKNOWN",
      assistanceAnimal: "MEETS",
    },
  },
  {
    id: "melbourne-gallery",
    name: "Riverside Arts Centre",
    category: "Arts and culture",
    suburb: "Southbank",
    city: "Melbourne",
    state: "VIC",
    summary:
      "Lift-served galleries with step-free circulation; accessible toilet evidence is incomplete.",
    evidenceState: "VERIFIED",
    evidenceLabel: "Verified",
    evidenceNote: "Access details checked against venue material and a recent verified observation.",
    updatedLabel: "Updated 28 Aug 2026",
    mapPosition: { x: 47, y: 68 },
    requirements: {
      stepFree: "MEETS",
      accessibleToilet: "UNKNOWN",
      lift: "MEETS",
      quietSpace: "UNKNOWN",
      hearingSupport: "MEETS",
      assistanceAnimal: "MEETS",
    },
  },
  {
    id: "brisbane-market",
    name: "River City Market Hall",
    category: "Shopping",
    suburb: "South Brisbane",
    city: "Brisbane",
    state: "QLD",
    summary:
      "Public step-free entry reported. Internal circulation and hearing support need confirmation.",
    evidenceState: "COMMUNITY_REPORTED",
    evidenceLabel: "Community reported",
    evidenceNote: "Community observation awaiting independent verification.",
    updatedLabel: "Reported 1 Oct 2026",
    mapPosition: { x: 72, y: 24 },
    requirements: {
      stepFree: "MEETS",
      accessibleToilet: "UNKNOWN",
      lift: "UNKNOWN",
      quietSpace: "DOES_NOT_MATCH",
      hearingSupport: "UNKNOWN",
      assistanceAnimal: "MEETS",
    },
  },
  {
    id: "adelaide-civic",
    name: "Central Civic Hub",
    category: "Community",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    summary:
      "Broad public-access information is available, but several functional details remain unknown.",
    evidenceState: "AUTHORITATIVE_SOURCE",
    evidenceLabel: "Authoritative source",
    evidenceNote: "Government facility information; functional detail remains incomplete.",
    updatedLabel: "Updated 7 Sep 2026",
    mapPosition: { x: 38, y: 54 },
    requirements: {
      stepFree: "MEETS",
      accessibleToilet: "MEETS",
      lift: "UNKNOWN",
      quietSpace: "UNKNOWN",
      hearingSupport: "UNKNOWN",
      assistanceAnimal: "MEETS",
    },
  },
  {
    id: "perth-station",
    name: "Westside Transport Interchange",
    category: "Transport",
    suburb: "Perth",
    city: "Perth",
    state: "WA",
    summary:
      "Step-free platform access is documented; quiet-space and toilet evidence varies by concourse.",
    evidenceState: "VERIFIED",
    evidenceLabel: "Verified",
    evidenceNote: "Transport operator data cross-checked with a recent access observation.",
    updatedLabel: "Updated 21 Sep 2026",
    mapPosition: { x: 18, y: 42 },
    requirements: {
      stepFree: "MEETS",
      accessibleToilet: "MEETS",
      lift: "MEETS",
      quietSpace: "UNKNOWN",
      hearingSupport: "MEETS",
      assistanceAnimal: "MEETS",
    },
  },
  {
    id: "hobart-museum",
    name: "Tasman Discovery Centre",
    category: "Museum",
    suburb: "Hobart",
    city: "Hobart",
    state: "TAS",
    summary:
      "Ground-floor access is step-free. Upper-level access evidence is currently incomplete.",
    evidenceState: "COMMUNITY_REPORTED",
    evidenceLabel: "Community reported",
    evidenceNote: "Participant-submitted observation with source photo pending review.",
    updatedLabel: "Reported 25 Sep 2026",
    mapPosition: { x: 56, y: 86 },
    requirements: {
      stepFree: "MEETS",
      accessibleToilet: "MEETS",
      lift: "UNKNOWN",
      quietSpace: "MEETS",
      hearingSupport: "UNKNOWN",
      assistanceAnimal: "MEETS",
    },
  },
  {
    id: "darwin-waterfront",
    name: "Waterfront Community Pavilion",
    category: "Community",
    suburb: "Darwin City",
    city: "Darwin",
    state: "NT",
    summary:
      "Public access information is limited. Unknown fields are intentionally retained as unknown.",
    evidenceState: "UNKNOWN",
    evidenceLabel: "Evidence incomplete",
    evidenceNote: "No current source strong enough to verify the functional details.",
    updatedLabel: "Evidence review pending",
    mapPosition: { x: 42, y: 12 },
    requirements: {
      stepFree: "UNKNOWN",
      accessibleToilet: "UNKNOWN",
      lift: "UNKNOWN",
      quietSpace: "UNKNOWN",
      hearingSupport: "UNKNOWN",
      assistanceAnimal: "UNKNOWN",
    },
  },
  {
    id: "canberra-library",
    name: "Capital Learning Commons",
    category: "Library",
    suburb: "Canberra",
    city: "Canberra",
    state: "ACT",
    summary:
      "Documented step-free entry, lift and accessible toilet with a quiet study area.",
    evidenceState: "VERIFIED",
    evidenceLabel: "Verified",
    evidenceNote: "Venue access guide cross-checked with verified community evidence.",
    updatedLabel: "Updated 30 Sep 2026",
    mapPosition: { x: 60, y: 58 },
    requirements: {
      stepFree: "MEETS",
      accessibleToilet: "MEETS",
      lift: "MEETS",
      quietSpace: "MEETS",
      hearingSupport: "UNKNOWN",
      assistanceAnimal: "MEETS",
    },
  },
];
