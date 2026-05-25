import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getTransportDriverForUser } from "@/lib/transport-mvp/access-control";
import { plainLanguageMvpStatus } from "@/lib/transport-mvp/trip-lifecycle-service";

export default async function DriverTripsPage() {
  const user = await requireAuth();
  const driver = await getTransportDriverForUser(user.id);
  const trips = driver
    ? await prisma.transportTrip.findMany({
        where: { dispatch: { driverId: driver.id } },
        orderBy: { createdAt: "desc" },
        include: { request: true, dispatch: true, evidence: true },
      })
    : [];

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold">Your trips</h2>
      {!driver ? (
        <p className="text-muted-foreground" role="alert">
          No driver profile linked to your account.
        </p>
      ) : trips.length === 0 ? (
        <p role="status">No assigned trips.</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/driver/trips/${t.id}`}
                className="block min-h-16 rounded-xl border border-border bg-card p-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-xs uppercase text-muted-foreground">
                  {plainLanguageMvpStatus(t.status)}
                </span>
                <p className="mt-1 font-medium">{t.request.pickupAddress}</p>
                <p className="text-sm text-muted-foreground">to {t.request.dropoffAddress}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
