export type BillableSourceKeyInput = {
  organisationId: string;
  participantId: string | null;
  sourceType:
    | "booking"
    | "care_shift"
    | "timesheet"
    | "delivery_event"
    | "manual"
    | "legacy_claim_line"
    | "correction";
  sourceId: string;
  chargeType: string;
  serviceStartAtIso: string;
  supportItemCode: string | null;
  correctionGeneration: number;
};

/**
 * Deterministic idempotency key for billable service items.
 * Format is stable for uniqueness constraint (organisationId, sourceKey).
 */
export function buildBillableSourceKey(input: BillableSourceKeyInput): string {
  const parts = [
    input.sourceType,
    input.sourceId.trim(),
    input.participantId?.trim() || "none",
    input.chargeType.trim(),
    input.serviceStartAtIso.trim(),
    (input.supportItemCode ?? "NO_CODE").trim().toUpperCase(),
    `g${input.correctionGeneration}`,
  ];
  return parts.join("|");
}
