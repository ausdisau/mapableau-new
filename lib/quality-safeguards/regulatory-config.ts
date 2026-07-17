/**
 * Versioned regulatory profile for reportability decision support.
 * Stored as configuration — never treated as legal advice.
 * As at July 2026: serious reportable incidents generally require
 * notification within 24 hours of awareness; unauthorised restrictive
 * practices without immediate harm generally use five business days.
 */

export const REGULATORY_PROFILE_JULY_2026 = {
  code: "ndis_reportable_incidents",
  version: "2026-07",
  jurisdiction: "AU",
  disclaimer:
    "Advisory configuration only. MapAble is not the NDIS regulator, an approved quality auditor, a clinical authority, or a legal adviser. Authorised human confirmation is required before any notification decision.",
  categories: [
    {
      code: "death",
      label: "Death",
      initialDeadline: { kind: "hours" as const, value: 24 },
      followUpDeadline: { kind: "businessDays" as const, value: 5 },
    },
    {
      code: "serious_injury",
      label: "Serious injury",
      initialDeadline: { kind: "hours" as const, value: 24 },
      followUpDeadline: { kind: "businessDays" as const, value: 5 },
    },
    {
      code: "abuse_or_neglect",
      label: "Abuse or neglect",
      initialDeadline: { kind: "hours" as const, value: 24 },
      followUpDeadline: { kind: "businessDays" as const, value: 5 },
    },
    {
      code: "unlawful_sexual_or_physical_contact",
      label: "Unlawful physical or sexual contact or assault",
      initialDeadline: { kind: "hours" as const, value: 24 },
      followUpDeadline: { kind: "businessDays" as const, value: 5 },
    },
    {
      code: "sexual_misconduct",
      label: "Sexual misconduct, including grooming",
      initialDeadline: { kind: "hours" as const, value: 24 },
      followUpDeadline: { kind: "businessDays" as const, value: 5 },
    },
    {
      code: "unauthorised_restrictive_practice",
      label: "Unauthorised restrictive practice",
      initialDeadline: { kind: "businessDays" as const, value: 5 },
      initialDeadlineIfHarm: { kind: "hours" as const, value: 24 },
      followUpDeadline: { kind: "businessDays" as const, value: 5 },
    },
    {
      code: "internally_managed",
      label: "Other internally managed incident",
      initialDeadline: null,
      followUpDeadline: null,
    },
  ],
  defaultTimezone: "Australia/Sydney",
} as const;

export type RegulatoryProfile = typeof REGULATORY_PROFILE_JULY_2026;

export function getActiveRegulatoryProfile(): RegulatoryProfile {
  return REGULATORY_PROFILE_JULY_2026;
}
