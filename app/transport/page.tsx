import Link from "next/link";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { TransportTripListItem } from "@/components/transport/TransportTripListItem";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { mapableHubPageStackClass, mapableSectionHeadingClass } from "@/lib/brand/styles";
import { listTransportTripsForUser } from "@/lib/transport/transport-trip-service";

export const metadata = {
  title: "MapAble Transport",
  description: "Book accessible transport and manage scheduled trips.",
};

export default async function TransportHubPage() {
  const user = await requirePermission("transport:read:self");
  const trips = await listTransportTripsForUser(user);

  return (
    <div className={mapableHubPageStackClass}>
      <CorePageHeader
        eyebrow="Mobility"
        title="MapAble Transport"
        description="Book accessible journeys, track scheduled trips, and find verified transport operators. Route estimates are advisory; live GPS is off unless enabled for your organisation."
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="default" size="default">
            <Link href="/dashboard/transport/new">Book a trip</Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link href="/dashboard/transport">All trips</Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link href="/dashboard/find-transport">Find operators</Link>
          </Button>
        </div>
      </CorePageHeader>

      <section>
        <h2 className={mapableSectionHeadingClass}>Recent trips</h2>
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
