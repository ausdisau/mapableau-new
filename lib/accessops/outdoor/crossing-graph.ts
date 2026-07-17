import type { JsonObject } from "../types";

export function buildCrossingGraph(
  features: JsonObject[],
  provenance: string,
): JsonObject {
  return {
    type: "crossing-graph",
    provenance,
    providerActivated: false,
    features,
  };
}
