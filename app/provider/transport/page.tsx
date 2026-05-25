import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import {
  listOrgTripRequests,
  listOrgTrips,
} from "@/lib/transport-mvp/provider-inbox-service";

export default async function ProviderTransportHubPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const [requests, trips] = await Promise.all([
    listOrgTripRequests(orgIds),
    listOrgTrips(orgIds),
  ]);
  const pending = requests.filter((r) => r.status === "requested").length;
  const awaitingDispatch = trips.filter(
    (t) => t.status === "accepted" && !t.dispatch
  ).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Transport</h1>
        <p className="text-muted-foreground">
          Manage trip requests, dispatch drivers and vehicles, and review trip evidence.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/provider/transport/requests" className="rounded-xl border p-4 hover:bg-muted/30">
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-sm">Requests awaiting response</p>
        </Link>
        <Link href="/provider/transport/dispatch" className="rounded-xl border p-4 hover:bg-muted/30">
          <p className="text-2xl font-bold">{awaitingDispatch}</p>
          <p className="text-sm">Trips needing dispatch</p>
        </Link>
        <div className="rounded-xl border p-4">
          <p className="text-2xl font-bold">{trips.length}</p>
          <p className="text-sm">Active organisation trips</p>
        </div>
      </div>
      <section>
        <h2 className="font-heading text-lg font-semibold">Recent trips</h2>
        <ul className="mt-3 space-y-2">
          {trips.slice(0, 5).map((t) => (
            <li key={t.id}>
              <Link href={`/provider/transport/trips/${t.id}`} className="text-primary hover:underline">
                {t.request.pickupAddress} to {t.request.dropoffAddress}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
