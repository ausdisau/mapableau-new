import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";

/** Demo banner shown on all public Digital Twin pages. */
export const DIGITAL_TWIN_DEMO_BANNER =
  "Demo data only. These places are fictional examples for preview purposes. Always confirm critical access needs before travelling.";

/** Extended disclaimer for Digital Twin surfaces. */
export const DIGITAL_TWIN_DISCLAIMER =
  `${ACCESS_DISCLAIMER} MapAble Digital Twin provides structured access information and coordination support. It is not a certificate of legal compliance, building certification, or NDIS eligibility. Always confirm critical access needs before travelling.`;

/** Default disclaimer included in scoring and assessment outputs. */
export const SCORING_DISCLAIMER =
  "This score reflects available evidence and structured assessment criteria. It is verification and information support, not legal certification or compliance determination.";

/** Assessment domain groups used by the scoring engine. */
export const ASSESSMENT_DOMAINS = [
  "external_path",
  "entry_exit",
  "interior_movement",
  "amenities_toilets",
  "information_sensory",
  "staff_services",
  "transport_connection",
  "online_information",
] as const;

export type AssessmentDomain = (typeof ASSESSMENT_DOMAINS)[number];

/** MapAble-style tier thresholds (aligned with accreditation scoring). */
export const TIER_THRESHOLDS = {
  gold: 90,
  silver: 70,
  bronze: 40,
} as const;

export const TIER_LABELS = {
  none: "Improvement needed",
  bronze: "Accessible (Bronze)",
  silver: "Highly accessible (Silver)",
  gold: "Universally accessible (Gold)",
  unknown: "Not yet assessed",
} as const;

/** Feature types mapped to assessment domains for scoring. */
export const FEATURE_DOMAIN_MAP: Record<string, AssessmentDomain> = {
  parking: "external_path",
  dropoff: "external_path",
  path: "external_path",
  entrance: "entry_exit",
  doorway: "entry_exit",
  ramp: "entry_exit",
  lift: "interior_movement",
  corridor: "interior_movement",
  counter: "staff_services",
  seating: "information_sensory",
  toilet: "amenities_toilets",
  signage: "information_sensory",
  hearing: "information_sensory",
  lighting: "information_sensory",
  acoustics: "information_sensory",
  staff_training: "staff_services",
  online_info: "online_information",
  emergency: "staff_services",
  transport_connection: "transport_connection",
  other: "information_sensory",
};

/** Minimum aggregation count before production intelligence reports. */
export const INTELLIGENCE_MIN_AGGREGATION = 5;
