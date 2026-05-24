import { DriverOsmTripActions } from "@/components/transport-osm/DriverOsmTripActions";
import { TripStatusTimeline } from "@/components/transport-osm/TripStatusTimeline";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getTripTracking, plainLanguageTripStatus } from "@/lib/tracking/trip-tracking-service";

export default async function DriverTripDetailPage({
  params,
}: {
  params: Promise<{ transportBookingId: string }>;
}) {
  await requireAuth();
  const { transportBookingId } = await params;
  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: {
      dispatchEvents: { orderBy: { createdAt: "asc" }, take: 10 },
    },
  });
  if (!tb) return <p role="alert">Trip not found.</p>;

  const tracking = await getTripTracking(transportBookingId);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold">Trip details</h2>
      <p className="text-lg">
        <strong>Pickup area:</strong> {tb.pickupAddress.split(",").slice(-2).join(",")}
      </p>
      <p className="text-lg">
        <strong>Drop-off area:</strong> {tb.dropoffAddress.split(",").slice(-2).join(",")}
      </p>
      {tb.driverAssistanceRequired ? (
        <p className="rounded-lg border p-3 text-sm" role="note">
          Driver assistance required for this trip.
        </p>
      ) : null}
      <p className="text-sm">
        Status:{" "}
        {tracking?.plainLanguageStatus ?? plainLanguageTripStatus("not_started")}
      </p>
      <TripStatusTimeline current={tb.status} events={tb.dispatchEvents} />
      <DriverOsmTripActions transportBookingId={tb.id} status={tb.status} />
    </div>
  );
}
