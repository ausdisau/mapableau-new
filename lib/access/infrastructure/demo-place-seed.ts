/**
 * Seeds one evidence-backed demo place for Access Infrastructure place compatibility demos.
 * Synthetic only — productionClaim: none. Idempotent.
 */

import { prisma } from "@/lib/prisma";

export const AAI_DEMO_PLACE_NAME = "MapAble AaI Compatibility Demo Venue";

export async function ensureAaIDemoPlace(): Promise<{ placeId: string }> {
  let place = await prisma.accessPlace.findFirst({
    where: { name: AAI_DEMO_PLACE_NAME },
  });

  if (!place) {
    place = await prisma.accessPlace.create({
      data: {
        name: AAI_DEMO_PLACE_NAME,
        category: "cafe_restaurant",
        description:
          "Synthetic venue for Access as Infrastructure place compatibility demos. Not a certification claim.",
        addressText: "10 Access Way",
        suburb: "Sydney",
        stateOrRegion: "NSW",
        status: "published",
        sourceType: "manual_admin",
        confidence: "mapable_verified",
        location: {
          create: { latitude: -33.8705, longitude: 151.208 },
        },
        features: {
          create: [{ type: "step_free_entry" }, { type: "accessible_toilet" }],
        },
      },
    });
  }

  const existingCaps = await prisma.accessCapabilityRecord.count({
    where: { placeId: place.id },
  });
  if (existingCaps > 0) {
    return { placeId: place.id };
  }

  const stepFreeObs = await prisma.accessObservationRecord.create({
    data: {
      featureKey: "ENTRANCE_STEP_FREE",
      ontologyConceptId: "mobility_movement.step_free",
      valueJson: true,
      sourceType: "trained_assessor",
      observedAt: new Date("2026-08-01T00:00:00.000Z"),
      evidenceKinds: ["site_assessment"],
      verificationStatus: "verified",
      confidence: 0.95,
      disputed: false,
      placeId: place.id,
      entityType: "place",
      entityId: place.id,
    },
  });

  const widthObs = await prisma.accessObservationRecord.create({
    data: {
      featureKey: "ENTRANCE_CLEAR_WIDTH",
      ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
      valueJson: 870,
      unit: "mm",
      sourceType: "trained_assessor",
      observedAt: new Date("2026-08-01T00:00:00.000Z"),
      evidenceKinds: ["measurement"],
      verificationStatus: "verified",
      confidence: 0.9,
      disputed: false,
      placeId: place.id,
      entityType: "place",
      entityId: place.id,
    },
  });

  // Unknown / not yet measured — must remain UNKNOWN, not NO.
  // Observation only; no capability published (absence ≠ inaccessible).
  await prisma.accessObservationRecord.create({
    data: {
      featureKey: "HEARING_AUGMENTATION",
      ontologyConceptId: "hearing.hearing_augmentation",
      valueJson: "unknown",
      sourceType: "system",
      observedAt: new Date("2026-08-01T00:00:00.000Z"),
      evidenceKinds: [],
      verificationStatus: "unknown",
      disputed: false,
      placeId: place.id,
      entityType: "place",
      entityId: place.id,
    },
  });

  await prisma.accessCapabilityRecord.create({
    data: {
      entityType: "place",
      entityId: place.id,
      placeId: place.id,
      ontologyConceptId: "mobility_movement.step_free",
      attribute: "step_free",
      valueJson: true,
      evidenceObservationId: stepFreeObs.id,
      status: "verified",
    },
  });

  await prisma.accessCapabilityRecord.create({
    data: {
      entityType: "place",
      entityId: place.id,
      placeId: place.id,
      ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
      attribute: "minimum_clear_width_mm",
      valueJson: 870,
      unit: "mm",
      evidenceObservationId: widthObs.id,
      status: "verified",
    },
  });

  await prisma.accessAdjustmentRecord.create({
    data: {
      entityType: "place",
      entityId: place.id,
      placeId: place.id,
      ontologyConceptId: "service_staff.adjustment_procedure",
      summary: "Table service available on request",
      description:
        "Staff can bring orders to the table when the counter height is unsuitable.",
      status: "venue_reported",
    },
  });

  return { placeId: place.id };
}
