import { stripRestrictedGeometry } from "../policy/restricted-geometry";
import type { JsonObject } from "../types";

export function filterOpenDataRecord(record: JsonObject): JsonObject | null {
  if (record.journeyId || record.participantId) return null;
  if (
    record.securityClassification === "restricted" ||
    record.securityClassification === "security_sensitive"
  )
    return null;
  return stripRestrictedGeometry(record);
}
