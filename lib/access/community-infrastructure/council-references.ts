import registryData from "@/data/community-infrastructure/council-references.json";

import type {
  CouncilBoundarySource,
  CouncilLinkage,
  CouncilReference,
} from "./council-types";
import type { CommunityInfrastructureFeature } from "./types";

// Reviewed source metadata only. Full polygons are used by the maintainer importer,
// not loaded into the public request path. Tests validate this shipped registry.
const registry = registryData as unknown as {
  boundarySource: CouncilBoundarySource;
  councils: CouncilReference[];
};

export const COUNCIL_BOUNDARY_SOURCE = registry.boundarySource;
export const COUNCIL_REFERENCES = registry.councils;

export function getCouncilReference(id: string) {
  return COUNCIL_REFERENCES.find((council) => council.id === id);
}

/** Counts describe all source records in a study window, not council-wide assets. */
export function getCouncilLinkage(
  features: CommunityInfrastructureFeature[],
): CouncilLinkage {
  const counts = new Map<string, number>();
  let ambiguousFeatureCount = 0;
  let unmatchedFeatureCount = 0;
  let notJoinedFeatureCount = 0;
  for (const feature of features) {
    const jurisdiction = feature.properties.councilJurisdiction;
    if (!jurisdiction) {
      notJoinedFeatureCount += 1;
    } else if (jurisdiction.status === "ambiguous") {
      ambiguousFeatureCount += 1;
    } else if (jurisdiction.status === "unmatched") {
      unmatchedFeatureCount += 1;
    } else {
      const id = jurisdiction.matches[0]?.councilId;
      if (!id || !getCouncilReference(id)) {
        notJoinedFeatureCount += 1;
        continue;
      }
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return {
    mode: "display_point_boundary_match",
    boundarySource: COUNCIL_BOUNDARY_SOURCE,
    councils: COUNCIL_REFERENCES.filter((council) =>
      counts.has(council.id),
    ).map((council) => ({ ...council, featureCount: counts.get(council.id)! })),
    ambiguousFeatureCount,
    unmatchedFeatureCount,
    notJoinedFeatureCount,
    notice:
      "Council associations follow the mapped point or approximate area centre within the downloaded NSW boundary polygons. They do not establish asset ownership, whole-facility boundaries or accessibility. Council pages are external reference links; their facility data has not been imported.",
  };
}
