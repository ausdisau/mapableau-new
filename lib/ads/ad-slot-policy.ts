/** Fields that must never be sent for ad targeting or analytics. */
export const FORBIDDEN_TARGETING_FIELDS = [
  "diagnosis",
  "ndisPlan",
  "ndis_plan",
  "clinicalNotes",
  "clinical_notes",
  "incidentHistory",
  "incident_history",
  "safeguardingStatus",
  "safeguarding_status",
  "privateMessages",
  "private_messages",
  "exactHomeAddress",
  "exact_home_address",
  "childStatus",
  "child_status",
  "participantId",
  "ndisNumber",
] as const;

export type SafeAdContext = {
  pageContext: string;
  serviceCategory?: string;
  region?: string;
  providerCategory?: string;
};

export function buildSafeAdContext(input: {
  pageContext: string;
  serviceCategory?: string;
  region?: string;
  providerCategory?: string;
}): SafeAdContext {
  return {
    pageContext: input.pageContext.slice(0, 80),
    ...(input.serviceCategory
      ? { serviceCategory: input.serviceCategory.slice(0, 80) }
      : {}),
    ...(input.region ? { region: input.region.slice(0, 80) } : {}),
    ...(input.providerCategory
      ? { providerCategory: input.providerCategory.slice(0, 80) }
      : {}),
  };
}

export function assertNoForbiddenTargeting(
  payload: Record<string, unknown>,
): void {
  for (const key of FORBIDDEN_TARGETING_FIELDS) {
    if (key in payload && payload[key] != null) {
      throw new Error(`Forbidden ad targeting field: ${key}`);
    }
  }
}

export const AD_DISCLOSURE =
  "Sponsored placements are paid advertisements. They do not affect provider verification, safety checks, or your accessibility preferences.";
