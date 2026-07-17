import type { JsonObject } from "../types";

export function openDataQualityWarnings(record: JsonObject): string[] {
  const warnings: string[] = [];
  if (!record.sourceReference) warnings.push("missing_source_reference");
  if (record.state === "unknown") warnings.push("unknown_status");
  return warnings;
}
