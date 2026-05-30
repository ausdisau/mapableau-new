import Link from "next/link";

import { TransportTripListItem } from "@/components/transport/TransportTripListItem";
import { requirePermission } from "@/lib/auth/guards";
import { listTransportTripsForUser } from "@/lib/transport/transport-trip-service";

export const metadata = {
  title: "MapAble Transport",
  description: "Book accessible transport and manage scheduled trips.",
};

export default async function TransportHubPage() {
  const user = await requirePermission("transport:read:self");
  const trips = await listTransportTripsForUser(user);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">MapAble Transport</h1>
        <p className="text-muted-foreground">
          Book accessible journeys, track scheduled trips, and find verified
          transport operators. Route estimates are advisory; live GPS is off unless
          enabled for your organisation.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/transport/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Book a trip
        </Link>
        <Link
          href="/dashboard/transport"
          className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          All trips
        </Link>
        <Link
          href="/dashboard/find-transport"
          className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          Find operators
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Recent trips</h2>
        {trips.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            No trips yet. Start with &quot;Book a trip&quot; above.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {trips.slice(0, 5).map((response) => (
              <li key={response.trip.id}>
                <TransportTripListItem response={response} />
              </li>
            ))}
          </ul>
        )}
        {trips.length > 5 ? (
          <p className="mt-3 text-sm">
            <Link href="/dashboard/transport" className="font-medium text-primary hover:underline">
              View all trips
            </Link>
          </p>
        ) : null}
      </section>

      <p className="text-sm text-muted-foreground">
        Providers:{" "}
        <Link href="/provider/transport" className="text-primary hover:underline">
          operator console
        </Link>
        . Drivers:{" "}
        <Link href="/driver/trips" className="text-primary hover:underline">
          driver trips
        </Link>
        .
      </p>
    </div>
  );
}
