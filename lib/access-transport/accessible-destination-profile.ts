import type { CurrentUser } from "@/lib/auth/current-user";
import { getPlaceAccessSummary } from "@/lib/access-map/domain-score-service";
import { listActiveAlertsForPlace } from "@/lib/access-alerts/access-alert-service";
import { prisma } from "@/lib/prisma";
import { mobilityFromAccessibilityProfile } from "@/lib/transport/mobility-schema";
import type { AccessibleDestinationProfile } from "@/types/access-transport";

export async function buildAccessibleDestinationProfile(params: {
  placeId: string;
  user?: CurrentUser | null;
}): Promise<AccessibleDestinationProfile | null> {
  const place = await prisma.accessPlace.findFirst({
    where: { id: params.placeId, status: "published" },
    include: {
      location: true,
      features: true,
      venueProfile: true,
    },
  });
  if (!place) return null;

  const [summary, alerts] = await Promise.all([
    getPlaceAccessSummary(params.placeId),
    listActiveAlertsForPlace(params.placeId),
  ]);

  const profile = params.user
    ? await prisma.accessibilityProfile.findUnique({
        where: { userId: params.user.id },
      })
    : null;

  const placeMatching = (profile?.placeMatchingRequirements ?? {}) as Record<
    string,
    unknown
  >;
  const mobility = profile
    ? mobilityFromAccessibilityProfile({
        transportRequirements: profile.transportRequirements as Record<
          string,
          unknown
        >,
        mobilityNeeds: profile.mobilityNeeds as string[],
      })
    : {};

  const warnings = alerts.map((a) => a.title);
  const hasStepFree = place.features.some(
    (f) => f.type === "step_free_entry" || f.type === "ramp_access"
  );

  const driverNotes: string[] = [];
  if (!hasStepFree) {
    driverNotes.push(
      "Check side entrances — step-free access may not be at the main entrance."
    );
  }
  if (place.features.some((f) => f.type === "accessible_dropoff")) {
    driverNotes.push("Accessible drop-off point reported at this venue.");
  }
  alerts.forEach((a) => {
    if (a.description) driverNotes.push(`${a.title}: ${a.description}`);
  });

  return {
    placeId: place.id,
    destinationName: place.name,
    accessSummary: {
      overallAccessScore: summary.overallScore,
      confidenceScore: summary.confidenceScore,
      lastVerifiedAt: summary.lastUpdated,
      activeAlerts: alerts.map((a) => a.id),
    },
    arrivalRequirements: {
      stepFreeRequired: placeMatching.stepFreeRequired === true,
      liftRequired: placeMatching.liftRequired === true,
      maxDistanceFromDropoffMeters:
        typeof placeMatching.maxDistanceFromDropoffMeters === "number"
          ? placeMatching.maxDistanceFromDropoffMeters
          : undefined,
      avoidSteepGradients: placeMatching.avoidSteepGradients === true,
      avoidCrowds: placeMatching.avoidCrowds === true,
      sensoryLowStimulusPreferred:
        placeMatching.sensoryLowStimulusPreferred === true,
    },
    transportInstructions: {
      driverNotes: driverNotes.join(" "),
      pickupAssistanceRequired: mobility.driverAssistanceRequired,
      dropoffAssistanceRequired: mobility.needsDriverAssistanceToDoor,
      mobilityAidType:
        mobility.requiresWheelchairAccessible === true
          ? "manual_wheelchair"
          : undefined,
      companionCount:
        typeof mobility.passengerCount === "number"
          ? mobility.passengerCount - 1
          : undefined,
    },
    destinationCoordinates: place.location
      ? { lat: place.location.latitude, lng: place.location.longitude }
      : undefined,
    dropoffAddress: [place.addressText, place.suburb, place.stateOrRegion]
      .filter(Boolean)
      .join(", "),
    accessWarnings: warnings,
  };
}
