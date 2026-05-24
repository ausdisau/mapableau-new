import { AccessibleMap } from "@/components/geo/AccessibleMap";
import { TripStatusTracker } from "@/components/transport/TripStatusTracker";
import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { requireAuth } from "@/lib/auth/guards";
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
    include: { vehicle: true },
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

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
      <StatusTextBadge status={booking.status} />
      <TripStatusTracker
        status={booking.status}
        pickupAddress={booking.pickupAddress}
        dropoffAddress={booking.dropoffAddress}
      />
      <AccessibleMap
        pickupLabel={booking.pickupAddress}
        dropoffLabel={booking.dropoffAddress}
        center={
          booking.pickupLat && booking.pickupLng
            ? [booking.pickupLng, booking.pickupLat]
            : undefined
        }
      />
      <VehicleSuitabilityWarning warnings={warnings} />
      {booking.bookingId ? (
        <a
          href={`/dashboard/bookings/${booking.bookingId}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View booking timeline
        </a>
      ) : null}
    </div>
  );
}
