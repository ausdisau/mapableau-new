import Link from "next/link";

import { DispatchAssignmentForm } from "@/components/transport-mvp/DispatchAssignmentForm";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { listOrgTrips } from "@/lib/transport-mvp/provider-inbox-service";
import { plainLanguageMvpStatus } from "@/lib/transport-mvp/trip-lifecycle-service";

export default async function ProviderTransportDispatchPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const trips = await listOrgTrips(orgIds);
  const needsDispatch = trips.filter(
    (t) => (t.status === "accepted" || t.status === "dispatched") && !t.dispatch
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Dispatch</h1>
        <p className="text-sm text-muted-foreground">
          Assign verified drivers and vehicles. Unverified resources cannot be dispatched.
        </p>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          Back to transport hub
        </Link>
      </header>

      {needsDispatch.length === 0 ? (
        <p className="rounded-xl border p-6 text-muted-foreground">
          No trips awaiting driver and vehicle assignment.
        </p>
      ) : (
        needsDispatch.map((t) => (
          <section key={t.id} className="rounded-xl border p-6">
            <h2 className="font-heading text-lg font-semibold">
              {t.request.pickupAddress}
            </h2>
            <p className="text-sm text-muted-foreground">
              Status: {plainLanguageMvpStatus(t.status)}
            </p>
            <div className="mt-4">
              <DispatchAssignmentForm tripId={t.id} organisationId={t.organisationId} />
            </div>
          </section>
        ))
      )}
    </div>
  );
}
