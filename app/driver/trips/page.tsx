import Link from "next/link";

import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getDriverTrips } from "@/lib/transport/transport-assignment-service";

export default async function DriverTripsPage() {
  const user = await requireAuth();
  const [legacyDriver, transportTrips] = await Promise.all([
    prisma.driverProfile.findFirst({
      where: { userId: user.id },
    }),
    getDriverTrips(user),
  ]);

  const legacyTrips = legacyDriver
    ? await prisma.transportBooking.findMany({
        where: { driverProfileId: legacyDriver.id },
        orderBy: { pickupWindowStart: "asc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold">Assigned transport trips</h2>
        {transportTrips.length === 0 ? (
          <p role="status">No assigned transport trips.</p>
        ) : (
          <ul className="space-y-3">
            {transportTrips.map((item) => (
              <li key={item.trip.id}>
                <Link
                  href={`/driver/transport/${item.trip.id}`}
                  className="block min-h-16 rounded-xl border border-border bg-card p-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TransportTripStatusBadge status={item.trip.status} />
                  <p className="mt-2 font-medium">
                    {item.trip.pickup.suburb ?? "Pickup"} →{" "}
                    {item.trip.dropoff.suburb ?? "Drop-off"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.trip.scheduledStart).toLocaleString("en-AU")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {legacyTrips.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-bold">Legacy bookings</h2>
          <ul className="space-y-3">
            {legacyTrips.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/driver/trips/${t.id}`}
                  className="block min-h-16 rounded-xl border border-border bg-card p-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="font-medium">{t.pickupAddress}</p>
                  <p className="text-sm text-muted-foreground">to {t.dropoffAddress}</p>
                  <p className="mt-1 text-sm">Status: {t.status.replace(/_/g, " ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
