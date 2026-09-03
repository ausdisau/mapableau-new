import type { ConsentRecipientType } from "@prisma/client";

import type { AccessFieldCategory } from "@/lib/trust/fabric/types";
import type { ConsentScope } from "@/types/mapable";

/** Keys that must never appear in employer-facing passport payloads. */
export const EMPLOYER_FORBIDDEN_PASSPORT_KEYS = [
  "diagnosis",
  "diagnosisCode",
  "medicalHistory",
  "clinicalNotes",
  "ndisPlanDetails",
  "medicationList",
  "disabilityCategory",
  "impairmentCategory",
] as const;

/** Field categories blocked for employer recipients regardless of consent scope. */
export const EMPLOYER_FORBIDDEN_FIELD_CATEGORIES: AccessFieldCategory[] = [
  "other_support_profile",
  "billing_summary",
];

export const CONSENT_SCOPE_FIELD_CATEGORIES: Partial<
  Record<ConsentScope, AccessFieldCategory[]>
> = {
  "profile.read": ["identity_contact", "other_support_profile"],
  "accessibility.read": [
    "access_requirements",
    "mobility_needs",
    "sensory_preferences",
    "communication_preferences",
    "cognitive_preferences",
    "digital_preferences",
  ],
  "transport.accessibility_share": [
    "mobility_needs",
    "transport_requirements",
    "access_requirements",
  ],
  "care.accessibility_share": [
    "access_requirements",
    "mobility_needs",
    "communication_preferences",
    "cognitive_preferences",
  ],
  "support_profile.read": [
    "communication_preferences",
    "cognitive_preferences",
    "other_support_profile",
  ],
  "engagement.read_delegate": ["active_authority", "service_history_summary"],
  "engagement.submit_delegate": ["active_authority"],
};

export function fieldCategoriesForConsentScope(
  scope: ConsentScope,
): AccessFieldCategory[] {
  return CONSENT_SCOPE_FIELD_CATEGORIES[scope] ?? ["access_requirements"];
}

export function filterPassportPayloadForRecipient<T extends Record<string, unknown>>(
  payload: T,
  recipientType?: ConsentRecipientType | "employer" | null,
): Partial<T> {
  const isEmployer =
    recipientType === "employer" ||
    recipientType === "organisation";

  if (!isEmployer) {
    return payload;
  }

  const filtered: Partial<T> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (
      (EMPLOYER_FORBIDDEN_PASSPORT_KEYS as readonly string[]).includes(key)
    ) {
      continue;
    }
    filtered[key as keyof T] = value as T[keyof T];
  }
  return filtered;
}

export function assertEmployerFieldCategoriesSafe(
  categories: AccessFieldCategory[],
): void {
  for (const category of categories) {
    if (EMPLOYER_FORBIDDEN_FIELD_CATEGORIES.includes(category)) {
      throw new Error(
        `Employer disclosure cannot include field category: ${category}`,
      );
    }
  }
}

export function filterFieldCategoriesForRecipient(
  categories: AccessFieldCategory[],
  recipientType?: ConsentRecipientType | "employer" | null,
): AccessFieldCategory[] {
  const isEmployer =
    recipientType === "employer" || recipientType === "organisation";

  if (!isEmployer) return categories;

  return categories.filter(
    (c) => !EMPLOYER_FORBIDDEN_FIELD_CATEGORIES.includes(c),
  );
}
