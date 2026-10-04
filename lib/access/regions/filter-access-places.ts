import type { AccessExplorationDto } from "@/lib/access/experience/access-exploration-dto";
import type {
  AccessCapitalRegionSlug,
  GccsaBoundaryFeatureCollection,
} from "@/lib/access/regions/gccsa";
import { pointIsInGccsaRegion } from "@/lib/access/regions/point-in-geometry";

export type GccsaPlaceFilterResult = {
  places: AccessExplorationDto[];
  unclassifiedCount: number;
  boundaryApplied: boolean;
};

export function filterPlacesToGccsaRegion(input: {
  places: AccessExplorationDto[];
  region: "all" | AccessCapitalRegionSlug;
  boundary: GccsaBoundaryFeatureCollection | null;
}): GccsaPlaceFilterResult {
  if (input.region === "all") {
    return {
      places: input.places,
      unclassifiedCount: 0,
      boundaryApplied: false,
    };
  }

  const hasBoundary = Boolean(
    input.boundary?.features.some(
      (feature) => feature.properties.mapableSlug === input.region,
    ),
  );

  if (!input.boundary || !hasBoundary) {
    return {
      places: input.places,
      unclassifiedCount: 0,
      boundaryApplied: false,
    };
  }

  const region = input.region;
  const boundary = input.boundary;
  let unclassifiedCount = 0;

  const places = input.places.filter((place) => {
    if (
      !place.hasCoordinates ||
      place.latitude == null ||
      place.longitude == null
    ) {
      unclassifiedCount += 1;
      return false;
    }

    return pointIsInGccsaRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      slug: region,
      boundary,
    });
  });

  return {
    places,
    unclassifiedCount,
    boundaryApplied: true,
  };
}
