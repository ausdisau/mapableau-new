import { AccessNeedsSummary } from "@/components/transport-mvp/AccessNeedsSummary";
import { InvoicePlaceholderCard } from "@/components/transport-mvp/InvoicePlaceholderCard";
import { ParticipantTripActions } from "@/components/transport-mvp/ParticipantTripActions";
import { TransportTripMap } from "@/components/transport-mvp/TransportTripMap";
import { TripStatusStepper } from "@/components/transport-mvp/TripStatusStepper";
import { requireAuth } from "@/lib/auth/guards";
import { buildAccessNeedsSummary } from "@/lib/transport-mvp/access-needs-summary";
import { getStopsForViewer } from "@/lib/transport-mvp/address-privacy";
import { getParticipantTripDetail } from "@/lib/transport-mvp/trip-request-service";

export default async function TransportTripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  let trip;
  try {
    trip = await getParticipantTripDetail(id, user.id);
  } catch {
    return <p role="alert">Trip not found.</p>;
  }

  const stops = getStopsForViewer(trip.stops, "participant");
  const accessSummary = buildAccessNeedsSummary(trip.accessNeeds, { canViewDetail: true });
  const canConfirm = trip.status === "completed" || trip.status === "arrived_dropoff";
  const canDispute = trip.status !== "disputed" && trip.status !== "cancelled";

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-heading text-2xl font-bold">Trip details</h2>
        <p className="text-sm text-muted-foreground">
          Pickup: {trip.request.pickupWindowStart.toLocaleString("en-AU")}
        </p>
      </header>

      <TripStatusStepper currentStatus={trip.status} />

      <section aria-labelledby="trip-map-heading">
        <h3 id="trip-map-heading" className="font-heading text-lg font-semibold">
          Route
        </h3>
        <div className="mt-3">
          <TransportTripMap stops={stops} />
        </div>
      </section>

      <AccessNeedsSummary lines={accessSummary.lines} shared={accessSummary.shared} />

      {trip.evidence ? (
        <section className="rounded-xl border p-4 text-sm">
          <h3 className="font-semibold">Trip evidence</h3>
          <p>Distance: {trip.evidence.distanceKm} km</p>
          <p>
            {trip.evidence.startedAt.toLocaleString("en-AU")} -{" "}
            {trip.evidence.completedAt.toLocaleString("en-AU")}
          </p>
        </section>
      ) : null}

      <ParticipantTripActions
        tripId={trip.id}
        canConfirm={canConfirm && !trip.participantConfirmedAt}
        canDispute={canDispute}
      />

      <InvoicePlaceholderCard tripId={trip.id} />
    </div>
  );
}
