import Link from "next/link";

import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { getDriverTrips } from "@/lib/transport/transport-assignment-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assigned transport trips | MapAble Driver",
};

export default async function DriverTransportTripsPage() {
  const user = await requireAuth();
  const trips = await getDriverTrips(user);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">Assigned transport trips</h1>
      <p className="text-sm text-muted-foreground">
        Advisory travel times and optional location sharing for TransportTrip
        assignments. Legacy booking trips stay under Your trips.
      </p>
      {trips.length === 0 ? (
        <p role="status">No assigned transport trips.</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((item) => (
            <li key={item.trip.id}>
              <Link
                href={`/driver/transport/${item.trip.id}`}
                className="block min-h-16 rounded-xl border border-border bg-card p-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="font-medium">
                  {item.trip.pickup.suburb ?? "Pickup"} →{" "}
                  {item.trip.dropoff.suburb ?? "Drop-off"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.trip.scheduledStart).toLocaleString("en-AU", {
                    timeZone: "Australia/Sydney",
                  })}
                </p>
                <TransportTripStatusBadge status={item.trip.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
