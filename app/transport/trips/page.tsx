import Link from "next/link";

import { plainLanguageMvpStatus } from "@/lib/transport-mvp/trip-lifecycle-service";
import { requireAuth } from "@/lib/auth/guards";
import { listParticipantTrips } from "@/lib/transport-mvp/trip-request-service";

export default async function TransportTripsPage() {
  const user = await requireAuth();
  const trips = await listParticipantTrips(user.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-bold">My transport trips</h2>
        <Link
          href="/transport/book"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
        >
          New request
        </Link>
      </header>
      <ul className="space-y-3">
        {trips.length === 0 ? (
          <li className="rounded-xl border p-6 text-muted-foreground">No trips yet.</li>
        ) : (
          trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/transport/trips/${t.id}`}
                className="block rounded-xl border p-4 hover:bg-muted/30"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {plainLanguageMvpStatus(t.status)}
                </span>
                <p className="mt-1 font-medium">{t.request.pickupAddress}</p>
                <p className="text-sm text-muted-foreground">to {t.request.dropoffAddress}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
