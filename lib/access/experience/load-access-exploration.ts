import "server-only";

import type { AccessExplorationDto } from "@/lib/access/experience/access-exploration-dto";
import { accessExperienceFlags } from "@/lib/access/experience/flags";
import { projectAccessPlaceToExplorationDto } from "@/lib/access/experience/project-access-place";
import {
  getPlaceById,
  listPublishedPlaces,
} from "@/lib/access/map/access-place-service";
import { listGaisFeaturesForPlace } from "@/lib/gais/service/gais-service";

/**
 * Load AccessPlace-backed exploration DTOs for the canonical /access experience.
 * GAIS enrichment is best-effort and never blocks the place list.
 */
export async function listAccessExplorationDtos(
  take = 200,
): Promise<AccessExplorationDto[]> {
  if (!accessExperienceFlags.enabled) {
    return [];
  }

  const places = await listPublishedPlaces(take);
  const dtos: AccessExplorationDto[] = [];

  for (const place of places) {
    let gaisFeatures;
    try {
      gaisFeatures = await listGaisFeaturesForPlace(place.id);
    } catch {
      gaisFeatures = undefined;
    }

    dtos.push(
      projectAccessPlaceToExplorationDto(
        {
          id: place.id,
          name: place.name,
          category: place.category,
          suburb: place.suburb,
          stateOrRegion: place.stateOrRegion,
          addressText: place.addressText,
          confidence: place.confidence,
          location: place.location
            ? {
                latitude: place.location.latitude,
                longitude: place.location.longitude,
              }
            : null,
          features: place.features.map((f) => ({ type: f.type })),
          reviewCount: place._count.reviews,
        },
        gaisFeatures,
      ),
    );
  }

  return dtos;
}

export async function getAccessExplorationDto(
  placeId: string,
): Promise<AccessExplorationDto | null> {
  if (!accessExperienceFlags.enabled) return null;

  const place = await getPlaceById(placeId, true);
  if (!place) return null;

  let gaisFeatures;
  try {
    gaisFeatures = await listGaisFeaturesForPlace(place.id);
  } catch {
    gaisFeatures = undefined;
  }

  return projectAccessPlaceToExplorationDto(
    {
      id: place.id,
      name: place.name,
      category: place.category,
      suburb: place.suburb,
      stateOrRegion: place.stateOrRegion,
      addressText: place.addressText,
      confidence: place.confidence,
      location: place.location
        ? {
            latitude: place.location.latitude,
            longitude: place.location.longitude,
          }
        : null,
      features: place.features.map((f) => ({ type: f.type })),
      reviewCount: place._count?.reviews ?? 0,
    },
    gaisFeatures,
  );
}
