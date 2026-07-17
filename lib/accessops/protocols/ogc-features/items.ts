import type { JsonObject } from "../../types";

export function stripParticipantDataFromFeature(
  feature: JsonObject,
): JsonObject {
  const next: JsonObject = {};
  for (const [key, value] of Object.entries(feature)) {
    if (!key.toLowerCase().includes("participant")) next[key] = value;
  }
  return next;
}
