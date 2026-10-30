/**
 * Historical records share a Prisma JSON column but not a clinical or
 * instrument meaning. This classifier NEVER converts self reports into
 * WHODAS, Vineland or I-CAN findings; unsupported forms fail closed.
 */
export type SupportNeedsRecordKind =
  | "participant_self_report_v1"
  | "legacy_registration_payload"
  | "legacy_ican_draft"
  | "unsupported";

export function classifySupportNeedsPayload(payload: unknown): SupportNeedsRecordKind {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "unsupported";
  }
  const record = payload as Record<string, unknown>;
  if (record.recordType === "participant_authored_support_snapshot") {
    return record.schemaVersion === 1 &&
      record.unselectedAreasMean === "not_assessed" &&
      Array.isArray(record.areas)
      ? "participant_self_report_v1" : "unsupported";
  }
  if (record.domains && typeof record.domains === "object" &&
      !Array.isArray(record.domains)) {
    return record.source === "registration_assessor"
      ? "legacy_registration_payload" : "legacy_ican_draft";
  }
  return "unsupported";
}
