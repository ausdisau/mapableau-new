import type { JsonObject } from "../types";

export function importOutdoorProviderData(
  features: JsonObject[],
  provenance: string,
): JsonObject {
  return { provenance, providerActivated: false, features };
}
