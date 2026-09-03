import type { AccessExplorationDto } from "@/lib/access/experience/access-exploration-dto";
import type {
  AccessRequirementProfile,
  UnknownHandling,
} from "@/lib/access/experience/types";
import {
  calculateAccessFitV2,
  shouldIncludePlaceForUnknownHandling,
} from "@/lib/access/fit/calculate-access-fit-v2";
import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";

/** Anything AccessFit can evaluate — AccessPlace DTO or legacy demo place. */
export type ExplorationFitSource = {
  id: string;
  profile: PlaceAccessProfile;
};

export function explorationDtoToFitSource(
  dto: AccessExplorationDto,
): ExplorationFitSource {
  return { id: dto.accessPlaceId, profile: dto.placeProfile };
}

export function demoPlaceToFitSource(place: DemoAccessPlace): ExplorationFitSource {
  return { id: place.id, profile: place.profile };
}

/**
 * Shared exploration result IDs — MAP and LIST must derive from this ordered set.
 * Map presentation may show a prefix (marker cap); list may paginate — same order.
 */
export function buildExplorationResultIds(
  places: ExplorationFitSource[],
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

/**
 * @deprecated Prefer buildExplorationResultIds(explorationDtoToFitSource(...)).
 * Kept so accessibility-map demos keep compiling during convergence.
 */
export function buildExplorationResultIdsFromDemoPlaces(
  places: DemoAccessPlace[],
  requirements: AccessRequirementProfile,
  unknownHandling: UnknownHandling = "SHOW",
): string[] {
  return buildExplorationResultIds(
    places.map(demoPlaceToFitSource),
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

/** Places without coordinates stay in LIST results; omitted from MAP markers. */
export function mapCoordinateIds(
  resultIds: string[],
  places: Array<{ id: string; hasCoordinates?: boolean; latitude?: number | null; longitude?: number | null }>,
): string[] {
  const byId = new Map(places.map((p) => [p.id, p]));
  return mapPresentationIds(resultIds).filter((id) => {
    const place = byId.get(id);
    if (!place) return false;
    if (typeof place.hasCoordinates === "boolean") return place.hasCoordinates;
    return (
      typeof place.latitude === "number" &&
      Number.isFinite(place.latitude) &&
      typeof place.longitude === "number" &&
      Number.isFinite(place.longitude)
    );
  });
}
