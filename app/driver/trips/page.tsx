import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { getTransportDriverForUser } from "@/lib/transport-mvp/access-control";
import { plainLanguageMvpStatus } from "@/lib/transport-mvp/trip-lifecycle-service";
import { prisma } from "@/lib/prisma";

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
        <p className="text-muted-foreground">No assigned trips.</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/driver/trips/${t.id}`}
                className="block rounded-xl border p-4 hover:bg-muted/30"
              >
                <span className="text-xs uppercase text-muted-foreground">
                  {plainLanguageMvpStatus(t.status)}
                </span>
                <p className="mt-1 font-medium">{t.request.pickupAddress}</p>
                <p className="text-sm text-muted-foreground">{t.request.dropoffAddress}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
