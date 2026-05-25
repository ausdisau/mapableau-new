import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { TransportRoutingPanel } from "@/components/transport/TransportRoutingPanel";
import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { requireAuth } from "@/lib/auth/guards";
import { isDynamicRoutingEnabled } from "@/lib/config/dynamic-routing";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import { computeDynamicRouteEstimate } from "@/lib/routing/dynamic-route-service";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

export const dynamic = "force-dynamic";

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
    booking.vehicle,
  );

  const routingEnabled = isDynamicRoutingEnabled();
  const initialEstimate = routingEnabled
    ? await computeDynamicRouteEstimate(transportBookingId)
    : null;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
      <StatusTextBadge status={booking.status} />
      <p>
        {booking.pickupAddress} → {booking.dropoffAddress}
      </p>
      <VehicleSuitabilityWarning warnings={warnings} />
      <TransportRoutingPanel
        transportBookingId={transportBookingId}
        routingEnabled={routingEnabled}
        optimisationEnabled={phase5Config.routeOptimisationEnabled}
        initialEstimate={initialEstimate}
      />
    </div>
  );
}
