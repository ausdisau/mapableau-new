import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
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
      <nav className="flex flex-wrap gap-3 text-sm font-medium">
        <Link href="/provider/transport/dispatch" className="text-primary hover:underline">
          Dispatch board ({tripCount} scheduled trips)
        </Link>
        <Link href="/provider/transport/runs" className="text-primary hover:underline">
          Ride runs (pooling)
        </Link>
      </nav>

      <section className="space-y-2">
        <h2 className="font-semibold">Legacy bookings</h2>
        <ul>
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/provider/transport/${b.id}`}>{b.pickupAddress}</Link>
            </li>
          ))}
        </ul>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No legacy bookings.</p>
        ) : null}
      </section>
    </div>
  );
}
