/**
 * Privacy-safe analytics policy. Wave 8 hardens the rule that analytics
 * exports and dashboards MUST NOT contain NDIS numbers, participant free-text
 * complaint content, or any identifier that lets a downstream consumer
 * re-identify a participant.
 */

const NDIS_NUMBER_PATTERN = /\b4[0-9]{8}\b/;

export class AnalyticsPrivacyViolationError extends Error {
  constructor(reason: string) {
    super(`ANALYTICS_PRIVACY_VIOLATION:${reason}`);
    this.name = "AnalyticsPrivacyViolationError";
  }
}

export function assertNoNdisNumber(value: string): void {
  if (NDIS_NUMBER_PATTERN.test(value)) {
    throw new AnalyticsPrivacyViolationError("ndis_number_detected");
  }
}

export function assertNoComplaintText(field: string): void {
  const forbidden = [
    "complaintText",
    "complaint_body",
    "complaintNarrative",
    "narrative",
  ];
  if (forbidden.includes(field)) {
    throw new AnalyticsPrivacyViolationError(`forbidden_field:${field}`);
  }
}

export function sanitiseAnalyticsRow<T extends Record<string, unknown>>(
  row: T
): T {
  const copy: Record<string, unknown> = { ...row };
  for (const key of Object.keys(copy)) {
    const val = copy[key];
    if (typeof val === "string" && NDIS_NUMBER_PATTERN.test(val)) {
      throw new AnalyticsPrivacyViolationError(`ndis_number_in:${key}`);
    }
    assertNoComplaintText(key);
  }
  return copy as T;
}
