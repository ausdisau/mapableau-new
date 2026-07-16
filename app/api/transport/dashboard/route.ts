import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { listTransportTripsForUser } from "@/lib/transport/transport-trip-service";
import { getTransportAccessProfile } from "@/lib/transport/transport-access-profile-service";
import { buildTransportFeaturesResponse } from "@/lib/transport/production-claims";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const trips = await listTransportTripsForUser(user);
    const profile = await getTransportAccessProfile(user);
    const features = buildTransportFeaturesResponse();

    const activeStatuses = new Set([
      "requested",
      "quoting",
      "quote_available",
      "participant_confirmed",
      "provider_review",
      "accepted",
      "dispatch_pending",
      "driver_vehicle_assigned",
      "driver_accepted",
      "pre_start_check_required",
      "en_route_to_pickup",
      "arrived_at_pickup",
      "participant_boarded",
      "en_route_to_dropoff",
      "arrived_at_dropoff",
      "incident_hold",
    ]);

    const awaitingParticipant = trips.filter((t) =>
      ["quote_available", "participant_review", "evidence_submitted"].includes(
        t.trip.status
      )
    );
    const upcoming = trips.filter((t) => activeStatuses.has(t.trip.status));
    const nextTrip = upcoming[0] ?? null;

    return jsonOk({
      nextTrip,
      awaitingParticipantAction: awaitingParticipant,
      upcoming,
      recent: trips.slice(0, 20),
      hasAccessProfile: Boolean(profile),
      features: {
        availableNow: features.availableNow,
        pilotOrSandbox: features.pilotOrSandbox.slice(0, 5),
      },
      stats: {
        totalTrips: trips.length,
        activeTrips: upcoming.length,
      },
    });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
