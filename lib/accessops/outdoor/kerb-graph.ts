import type { JsonObject } from "../types";

export function buildKerbGraph(
  features: JsonObject[],
  provenance: string,
): JsonObject {
  return { type: "kerb-graph", provenance, providerActivated: false, features };
}
