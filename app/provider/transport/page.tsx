import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { isTransportRidePoolingEnabled } from "@/lib/config/transport-accessible";
import { prisma } from "@/lib/prisma";

export default async function ProviderTransportPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const [bookings, tripCount] = await Promise.all([
    prisma.transportBooking.findMany({
      where: { operatorOrganisationId: { in: orgIds } },
      take: 20,
    }),
    prisma.transportTrip.count({
      where: { providerOrganisationId: { in: orgIds } },
    }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Transport</h1>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/provider/transport/dispatch"
          className="rounded-lg border border-border px-3 py-2 font-medium hover:bg-muted"
        >
          Dispatch board ({tripCount} trips)
        </Link>
        {isTransportRidePoolingEnabled() ? (
          <Link
            href="/provider/transport/runs"
            className="rounded-lg border border-border px-3 py-2 font-medium hover:bg-muted"
          >
            Ride run planner
          </Link>
        ) : null}
        <Link
          href="/provider/vehicles"
          className="rounded-lg border border-border px-3 py-2 font-medium hover:bg-muted"
        >
          Vehicles
        </Link>
        <Link
          href="/provider/drivers"
          className="rounded-lg border border-border px-3 py-2 font-medium hover:bg-muted"
        >
          Drivers
        </Link>
      </nav>
      <section className="space-y-2">
        <h2 className="font-semibold">Legacy transport bookings</h2>
        <ul className="list-disc pl-5 text-sm">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/provider/transport/${b.id}`}>{b.pickupAddress}</Link>
            </li>
          ))}
          {bookings.length === 0 ? (
            <li className="list-none text-muted-foreground">No legacy bookings</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
