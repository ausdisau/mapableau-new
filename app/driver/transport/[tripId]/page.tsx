import Link from "next/link";

import { DriverTransportTripActions } from "@/components/transport/DriverTransportTripActions";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { getDriverTrip } from "@/lib/transport/transport-assignment-service";

export default async function DriverTransportTripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireAuth();
  const { tripId } = await params;

  let tripResponse;
  try {
    tripResponse = await getDriverTrip(user, tripId);
  } catch {
    return <p role="alert">Trip not found or you are not assigned to this trip.</p>;
  }

  const { trip, nextActions } = tripResponse;

  return (
    <div className="space-y-6">
      <p>
        <Link href="/driver/trips" className="text-sm text-primary hover:underline">
          ← Your trips
        </Link>
      </p>
      <header className="space-y-2">
        <TransportTripStatusBadge status={trip.status} />
        <h2 className="font-heading text-xl font-bold">Trip details</h2>
      </header>
      <p className="text-lg">
        <strong>Pickup:</strong>{" "}
        {trip.pickup.address ?? trip.pickup.suburb ?? "Pickup location"}
      </p>
      <p className="text-lg">
        <strong>Drop-off:</strong>{" "}
        {trip.dropoff.address ?? trip.dropoff.suburb ?? "Drop-off location"}
      </p>
      <p className="text-sm text-muted-foreground">
        Scheduled: {new Date(trip.scheduledStart).toLocaleString("en-AU")}
      </p>
      <DriverTransportTripActions trip={trip} nextActions={nextActions} />
    </div>
  );
}
