import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { getFleetHealthSummary } from "@/lib/transport/transport-fleet-health-service";

export default async function FleetHealthPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation.</p>;
  }

  const health = await getFleetHealthSummary(organisationId);

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/provider/transport/fleet"
          className="text-sm text-primary hover:underline"
        >
          ← Fleet
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Fleet health</h1>
      <p className="text-sm text-muted-foreground">
        {health.counts.vehicles} vehicles, {health.counts.drivers} drivers —{" "}
        {health.counts.vehiclesNotReady} vehicles and{" "}
        {health.counts.driversNotReady} drivers need attention.
      </p>

      <section className="space-y-3">
        <h2 className="font-semibold">Vehicles</h2>
        {health.vehiclesWithIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">All vehicles are ready.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {health.vehiclesWithIssues.map((v) => (
              <li key={v.id} className="rounded-lg border border-border p-3">
                <Link
                  href={`/provider/transport/fleet/vehicles/${v.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {v.displayName}
                </Link>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {!v.active ? <li>Inactive</li> : null}
                  {v.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
                {v.activeTripCount > 0 ? (
                  <p className="mt-1 text-xs">
                    {v.activeTripCount} active assignment
                    {v.activeTripCount === 1 ? "" : "s"}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Drivers</h2>
        {health.driversWithIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">All drivers are ready.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {health.driversWithIssues.map((d) => (
              <li key={d.id} className="rounded-lg border border-border p-3">
                <Link
                  href={`/provider/transport/fleet/drivers/${d.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {d.displayName}
                </Link>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {!d.active ? <li>Inactive</li> : null}
                  {d.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
                {d.activeTripCount > 0 ? (
                  <p className="mt-1 text-xs">
                    {d.activeTripCount} active assignment
                    {d.activeTripCount === 1 ? "" : "s"}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
