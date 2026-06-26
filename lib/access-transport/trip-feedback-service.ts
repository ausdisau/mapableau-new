import { createAccessAlert } from "@/lib/access-alerts/access-alert-service";
import { addAccessVerification } from "@/lib/access-verification/verification-service";
import { recomputePlaceDomainSummaries } from "@/lib/access-map/domain-score-service";
import { recomputePlaceRatingSummaries } from "@/lib/access-reviews/review-summary-service";
import { prisma } from "@/lib/prisma";

export async function submitTripAccessFeedback(params: {
  tripId: string;
  placeId?: string;
  submittedById: string;
  dropoffAccessible?: boolean;
  entranceCorrect?: boolean;
  barriersNotes?: string;
  createAlert?: boolean;
}) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: params.tripId },
    select: {
      id: true,
      participantId: true,
      destinationAccessPlaceId: true,
    },
  });
  if (!trip) throw new Error("TRIP_NOT_FOUND");
  if (trip.participantId !== params.submittedById) {
    throw new Error("FORBIDDEN");
  }

  const placeId =
    params.placeId ?? trip.destinationAccessPlaceId ?? undefined;

  const feedback = await prisma.accessTripFeedback.upsert({
    where: { tripId: params.tripId },
    create: {
      tripId: params.tripId,
      placeId,
      dropoffAccessible: params.dropoffAccessible,
      entranceCorrect: params.entranceCorrect,
      barriersNotes: params.barriersNotes,
      createAlert: params.createAlert ?? false,
      submittedById: params.submittedById,
    },
    update: {
      dropoffAccessible: params.dropoffAccessible,
      entranceCorrect: params.entranceCorrect,
      barriersNotes: params.barriersNotes,
      createAlert: params.createAlert ?? false,
    },
  });

  if (placeId && params.entranceCorrect === false) {
    await addAccessVerification({
      targetType: "review",
      targetId: placeId,
      action: "outdated",
      userId: params.submittedById,
      notes: params.barriersNotes,
    });
  }

  if (placeId && params.dropoffAccessible === false && params.createAlert) {
    await createAccessAlert({
      placeId,
      alertType: "blocked_ramp",
      title: "Drop-off point reported inaccessible",
      description: params.barriersNotes,
      reportedById: params.submittedById,
    });
  }

  if (placeId && params.barriersNotes) {
    await recomputePlaceRatingSummaries(placeId);
    await recomputePlaceDomainSummaries(placeId);
  }

  return feedback;
}
