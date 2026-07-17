import type { JsonObject } from "../types";

export function buildSidewalkGraph(
  features: JsonObject[],
  provenance: string,
): JsonObject {
  return {
    type: "sidewalk-graph",
    provenance,
    providerActivated: false,
    features,
  };
}
