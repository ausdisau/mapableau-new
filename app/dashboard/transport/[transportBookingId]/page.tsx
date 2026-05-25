import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { AccessibleMap } from "@/components/transport/AccessibleMap";
import { RouteEstimatePanel } from "@/components/transport/RouteEstimatePanel";
import { TripStatusTracker } from "@/components/transport/TripStatusTracker";
import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { requireAuth } from "@/lib/auth/guards";
import { isDynamicRoutingEnabled } from "@/lib/config/dynamic-routing";
import { prisma } from "@/lib/prisma";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

export default async function TransportDetailPage({
  params,
}: {
  params: Promise<{ transportBookingId: string }>;
}) {
  const user = await requireAuth();
  const { transportBookingId } = await params;
  const booking = await prisma.transportBooking.findFirst({
    where: { id: transportBookingId, participantId: user.id },
    include: { booking: true, vehicle: true },
  });
  if (!booking) return <p role="alert">Booking not found.</p>;

  const reqs = (booking.vehicleRequirements ?? {}) as Record<string, boolean>;
  const warnings = getVehicleSuitabilityWarnings(
    {
      requiresWheelchairAccessible: reqs.requiresWheelchairAccessible,
      requiresRamp: reqs.requiresRamp,
    },
    booking.vehicle,
  );

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
      <StatusTextBadge status={booking.status} />
      <p>
        {booking.pickupAddress} → {booking.dropoffAddress}
      </p>
      {booking.booking ? (
        <p className="rounded-lg border p-3 text-sm">
          Booking status: {booking.booking.status.replace(/_/g, " ")}
        </p>
      ) : null}
      <VehicleSuitabilityWarning warnings={warnings} />
      <RouteEstimatePanel
        transportBookingId={booking.id}
        routingEnabled={isDynamicRoutingEnabled()}
      />
      <AccessibleMap
        points={[
          {
            id: "pickup",
            label: "Pickup",
            address: booking.pickupAddress,
            lat: booking.pickupLat,
            lng: booking.pickupLng,
          },
          {
            id: "dropoff",
            label: "Drop-off",
            address: booking.dropoffAddress,
            lat: booking.dropoffLat,
            lng: booking.dropoffLng,
          },
        ]}
      />
      <TripStatusTracker status={booking.status} />
    </div>
  );
}
