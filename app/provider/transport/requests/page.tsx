import Link from "next/link";

import { ProviderRequestActions } from "@/components/transport-mvp/ProviderRequestActions";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { listOrgTripRequests } from "@/lib/transport-mvp/provider-inbox-service";

export default async function ProviderTransportRequestsPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const requests = await listOrgTripRequests(orgIds);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Transport requests</h1>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          Back to transport hub
        </Link>
      </header>
      <ul className="space-y-4">
        {requests.length === 0 ? (
          <li className="rounded-xl border p-6 text-muted-foreground">No requests.</li>
        ) : (
          requests.map((r) => (
            <li key={r.id} className="rounded-xl border p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">{r.status}</p>
              <p className="mt-1 font-medium">{r.pickupAddress}</p>
              <p className="text-sm">to {r.dropoffAddress}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Participant: {r.participant.name} - Window:{" "}
                {r.pickupWindowStart.toLocaleString("en-AU")}
              </p>
              {r.accessNeeds?.wheelchairRequired ? (
                <p className="mt-2 text-sm" role="note">
                  Wheelchair-accessible vehicle required
                </p>
              ) : null}
              {r.status === "requested" ? (
                <div className="mt-4">
                  <ProviderRequestActions requestId={r.id} />
                </div>
              ) : r.trip ? (
                <Link
                  href={`/provider/transport/trips/${r.trip.id}`}
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  View trip
                </Link>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
