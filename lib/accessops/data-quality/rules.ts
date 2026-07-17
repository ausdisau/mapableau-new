import type { JsonObject } from "../types";

export function requiredFieldRule(
  record: JsonObject,
  field: string,
): string | null {
  return record[field] === undefined || record[field] === null
    ? `missing:${field}`
    : null;
}
