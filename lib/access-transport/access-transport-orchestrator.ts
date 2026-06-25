import type { CurrentUser } from "@/lib/auth/current-user";
import { buildAccessibleDestinationProfile } from "@/lib/access-transport/accessible-destination-profile";
import { computeJourneyConfidence } from "@/lib/access-transport/journey-confidence-service";
import { createTransportTrip } from "@/lib/transport/transport-trip-service";
import { prisma } from "@/lib/prisma";

export async function createTripFromAccessPlace(params: {
  user: CurrentUser;
  placeId: string;
  pickupAddress: string;
  pickupSuburb?: string;
  scheduledStart: string;
  prefillFromProfile?: boolean;
}) {
  const destinationProfile = await buildAccessibleDestinationProfile({
    placeId: params.placeId,
    user: params.user,
  });
  if (!destinationProfile) {
    throw new Error("PLACE_NOT_FOUND");
  }

  const journeyConfidence = computeJourneyConfidence({
    destinationProfile,
    hasMobilityPrefill: params.prefillFromProfile !== false,
  });

  const dropoffAddress =
    destinationProfile.dropoffAddress ?? destinationProfile.destinationName;

  const coords = destinationProfile.destinationCoordinates;

  const tripResult = await createTransportTrip(params.user, {
    pickupAddress: params.pickupAddress,
    pickupSuburb: params.pickupSuburb,
    dropoffAddress,
    dropoffSuburb: undefined,
    dropoffLat: coords?.lat,
    dropoffLng: coords?.lng,
    scheduledStart: params.scheduledStart,
    accessNotes: destinationProfile.transportInstructions.driverNotes,
    prefillFromProfile: params.prefillFromProfile !== false,
    destinationAccessPlaceId: params.placeId,
    accessDestinationProfileJson: destinationProfile as unknown as Record<
      string,
      unknown
    >,
    journeyConfidenceJson: journeyConfidence as unknown as Record<
      string,
      unknown
    >,
  });

  return { tripResult, destinationProfile, journeyConfidence };
}

export async function attachDestinationProfileToExistingTrip(
  tripId: string,
  placeId: string,
  user: CurrentUser
) {
  const destinationProfile = await buildAccessibleDestinationProfile({
    placeId,
    user,
  });
  if (!destinationProfile) return null;

  const journeyConfidence = computeJourneyConfidence({
    destinationProfile,
    hasMobilityPrefill: true,
  });

  await prisma.transportTrip.update({
    where: { id: tripId },
    data: {
      destinationAccessPlaceId: placeId,
      accessDestinationProfileJson: destinationProfile,
      journeyConfidenceJson: journeyConfidence,
    },
  });

  return { destinationProfile, journeyConfidence };
}
