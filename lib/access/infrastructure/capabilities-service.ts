import { prisma } from "@/lib/prisma";

import { mapAdjustment, mapCapability, mapObservation } from "./mappers";
import type { AccessAdjustment, AccessCapability, AccessObservation } from "./types";

/** Map legacy AccessPlaceFeatureType → ontology concept for demo projection. */
export const PLACE_FEATURE_TO_ONTOLOGY: Record<string, string> = {
  step_free_entry: "mobility_movement.step_free",
  accessible_toilet: "self_care_continence.accessible_toilet",
  hearing_loop: "hearing.hearing_augmentation",
  changing_places: "self_care_continence.changing_places",
};

export async function listPlaceCapabilities(placeId: string): Promise<{
  placeId: string;
  capabilities: AccessCapability[];
  observations: AccessObservation[];
  adjustments: AccessAdjustment[];
  productionClaim: "none";
}> {
  const [capabilities, observations, adjustments] = await Promise.all([
    prisma.accessCapabilityRecord.findMany({
      where: {
        OR: [{ placeId }, { entityType: "place", entityId: placeId }],
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.accessObservationRecord.findMany({
      where: {
        OR: [{ placeId }, { entityType: "place", entityId: placeId }],
      },
      orderBy: { observedAt: "desc" },
    }),
    prisma.accessAdjustmentRecord.findMany({
      where: {
        OR: [{ placeId }, { entityType: "place", entityId: placeId }],
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    placeId,
    capabilities: capabilities.map(mapCapability),
    observations: observations.map(mapObservation),
    adjustments: adjustments.map(mapAdjustment),
    productionClaim: "none",
  };
}

export async function listEntityCapabilities(
  entityType: AccessCapability["entityType"],
  entityId: string,
): Promise<{
  entityType: AccessCapability["entityType"];
  entityId: string;
  capabilities: AccessCapability[];
  observations: AccessObservation[];
  adjustments: AccessAdjustment[];
  productionClaim: "none";
}> {
  const [capabilities, observations, adjustments] = await Promise.all([
    prisma.accessCapabilityRecord.findMany({
      where: { entityType, entityId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.accessObservationRecord.findMany({
      where: { entityType, entityId },
      orderBy: { observedAt: "desc" },
    }),
    prisma.accessAdjustmentRecord.findMany({
      where: { entityType, entityId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    entityType,
    entityId,
    capabilities: capabilities.map(mapCapability),
    observations: observations.map(mapObservation),
    adjustments: adjustments.map(mapAdjustment),
    productionClaim: "none",
  };
}
