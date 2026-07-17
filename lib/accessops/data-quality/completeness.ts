import type { JsonObject } from "../types";

export function completenessScore(
  record: JsonObject,
  fields: string[],
): number {
  if (fields.length === 0) return 1;
  const present = fields.filter(
    (field) => record[field] !== undefined && record[field] !== null,
  ).length;
  return present / fields.length;
}
