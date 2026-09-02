import type { UnknownHandling , AccessRequirementProfile } from "@/lib/access/experience/types";
import {
  calculateAccessFitV2,
  shouldIncludePlaceForUnknownHandling,
} from "@/lib/access/fit/calculate-access-fit-v2";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";

/**
 * Shared exploration result IDs — MAP and LIST must derive from this ordered set.
 * Map presentation may show a prefix (marker cap); list may paginate — same order.
 */
export function buildExplorationResultIds(
  places: DemoAccessPlace[],
  requirements: AccessRequirementProfile,
  unknownHandling: UnknownHandling = "SHOW",
): string[] {
  return places
    .filter((place) => {
      const fit = calculateAccessFitV2(requirements, place.profile);
      return shouldIncludePlaceForUnknownHandling(fit, unknownHandling);
    })
    .map((place) => place.id);
}

export function orderPlacesByResultIds(
  places: DemoAccessPlace[],
  resultIds: string[],
): DemoAccessPlace[] {
  const byId = new Map(places.map((p) => [p.id, p]));
  return resultIds
    .map((id) => byId.get(id))
    .filter((p): p is DemoAccessPlace => Boolean(p));
}

/** MAP marker soft limit — documented presentation cap, not a second query. */
export const MAP_MARKER_PRESENTATION_LIMIT = 1000;

export const LIST_PAGE_PRESENTATION_SIZE = 80;

export function mapPresentationIds(resultIds: string[]): string[] {
  return resultIds.slice(0, MAP_MARKER_PRESENTATION_LIMIT);
}

export function listPresentationIds(
  resultIds: string[],
  limit: number,
): string[] {
  return resultIds.slice(0, limit);
}
