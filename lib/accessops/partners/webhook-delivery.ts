import type { JsonObject } from "../types";

export function filterWebhookPayload(payload: JsonObject): JsonObject {
  const filtered: JsonObject = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!key.toLowerCase().includes("participant")) filtered[key] = value;
  }
  return filtered;
}
