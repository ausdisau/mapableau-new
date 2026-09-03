import type { AccessExplorationPlace } from "@/lib/access/experience/access-exploration-dto";
import type {
  AccessRequirementProfile,
  UnknownHandling,
} from "@/lib/access/experience/types";
import {
  calculateAccessFitV2,
  shouldIncludePlaceForUnknownHandling,
} from "@/lib/access/fit/calculate-access-fit-v2";
import type { PlaceAccessProfile } from "@/lib/access/fit/types";

/**
 * Minimal carrier for MAP/LIST shared result IDs.
 * DemoAccessPlace already matches; AccessExplorationPlace maps via helper.
 */
export type ExplorationProfileCarrier = {
  id: string;
  profile: PlaceAccessProfile;
};

/**
 * Shared exploration result IDs — MAP and LIST must derive from this ordered set.
 * Map presentation may show a prefix (marker cap); list may paginate — same order.
 *
 * Canonical V2 path: AccessExplorationPlace (AccessPlace + GAIS).
 * DemoAccessPlace remains supported for `/accessibility-map` legacy + tests only.
 */
export function buildExplorationResultIds(
  places: ExplorationProfileCarrier[],
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

/** Project AccessExplorationPlace → carrier used by result ID helpers. */
export function toExplorationProfileCarrier(
  place: AccessExplorationPlace,
): ExplorationProfileCarrier {
  return {
    id: place.placeId,
    profile: place.accessProfile,
  };
}

export function buildExplorationResultIdsFromAccessPlaces(
  places: AccessExplorationPlace[],
  requirements: AccessRequirementProfile,
  unknownHandling: UnknownHandling = "SHOW",
): string[] {
  return buildExplorationResultIds(
    places.map(toExplorationProfileCarrier),
    requirements,
    unknownHandling,
  );
}

export function orderPlacesByResultIds<T extends { id: string }>(
  places: T[],
  resultIds: string[],
): T[] {
  const byId = new Map(places.map((p) => [p.id, p]));
  return resultIds
    .map((id) => byId.get(id))
    .filter((p): p is T => Boolean(p));
}

/** Order AccessExplorationPlace by shared result IDs (uses placeId). */
export function orderAccessExplorationPlacesByResultIds(
  places: AccessExplorationPlace[],
  resultIds: string[],
): AccessExplorationPlace[] {
  const byId = new Map(places.map((p) => [p.placeId, p]));
  return resultIds
    .map((id) => byId.get(id))
    .filter((p): p is AccessExplorationPlace => Boolean(p));
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
