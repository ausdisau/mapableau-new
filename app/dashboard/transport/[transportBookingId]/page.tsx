import { ParticipantTripActions } from "@/components/transport-osm/ParticipantTripActions";
import { TripStatusTimeline } from "@/components/transport-osm/TripStatusTimeline";
import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";
import { TRANSPORT_STATUS_LABELS } from "@/types/transport-osm";

export default async function TransportDetailPage({
  params,
}: {
  params: Promise<{ transportBookingId: string }>;
}) {
  const user = await requireAuth();
  const { transportBookingId } = await params;
  const booking = await prisma.transportBooking.findFirst({
    where: { id: transportBookingId, participantId: user.id },
    include: {
      vehicle: true,
      dispatchEvents: { orderBy: { createdAt: "asc" }, take: 20 },
      tripQuotes: { where: { status: "active" }, take: 1 },
    },
  });
  if (!booking) return <p role="alert">Booking not found.</p>;

  const reqs = (booking.vehicleRequirements ?? {}) as Record<string, boolean>;
  const warnings = getVehicleSuitabilityWarnings(
    {
      requiresWheelchairAccessible: reqs.requiresWheelchairAccessible,
      requiresRamp: reqs.requiresRamp,
    },
    booking.vehicle
  );

  const activeQuote = booking.tripQuotes[0];
  const fare = activeQuote?.fareBreakdown as { totalCents?: number } | null;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
      <p className="text-lg">
        <span className="font-medium">Status: </span>
        {TRANSPORT_STATUS_LABELS[booking.status]}
      </p>
      <p>
        {booking.pickupAddress} → {booking.dropoffAddress}
      </p>
      {fare?.totalCents != null ? (
        <p className="text-sm">
          Quoted fare: ${(fare.totalCents / 100).toFixed(2)} AUD
        </p>
      ) : null}
      <ParticipantTripActions
        transportBookingId={booking.id}
        status={booking.status}
      />
      <TripStatusTimeline
        current={booking.status}
        events={booking.dispatchEvents}
      />
      <VehicleSuitabilityWarning warnings={warnings} />
      <section aria-labelledby="messages-heading">
        <h2 id="messages-heading" className="text-lg font-semibold">
          Messages about this trip
        </h2>
        <p className="text-sm text-muted-foreground">
          Use the booking thread in your dashboard messages once a provider is assigned.
        </p>
      </section>
    </div>
  );
}
