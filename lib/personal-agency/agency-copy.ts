/**
 * Plain-language agency boundaries for My MapAble UI.
 * Comprehensible without AI/agent jargon.
 */

export const AGENCY_CAN = [
  "search for information",
  "compare options",
  "suggest next steps",
  "draft messages for you to review",
  "organise what you save in My MapAble",
] as const;

export const AGENCY_MUST_ASK = [
  "contacting someone on your behalf",
  "sharing your personal information",
  "making or changing a booking",
  "spending money",
  "changing who can act for you",
] as const;

export const AGENCY_NEVER = [
  "drive or steer a wheelchair",
  "make clinical or safeguarding decisions for you",
  "turn AI suggestions into decisions without your approval",
] as const;

export type AgencyConsequenceKind =
  | "CONTACT"
  | "SHARE"
  | "BOOK"
  | "SPEND"
  | "AUTHORITY";

export const EVIDENCE_STATE_LABELS = {
  verified: "Verified",
  government_source: "Government source",
  venue_declared: "Venue or provider declared",
  community_confirmed: "Community confirmed",
  sensor_observed: "Sensor observed",
  ai_inferred: "AI inferred",
  unknown: "Unknown",
} as const;

export type EvidenceStateKey = keyof typeof EVIDENCE_STATE_LABELS;
