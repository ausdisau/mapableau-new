import Link from "next/link";

import { FleetEligibilityBadge } from "@/components/transport/FleetEligibilityBadge";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { listFleetDrivers } from "@/lib/transport/transport-fleet-read-service";

export default async function FleetDriversPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation to manage fleet drivers.</p>;
  }

  const drivers = await listFleetDrivers(organisationId);

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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Fleet drivers</h1>
        <Link
          href="/provider/transport/fleet/drivers/new"
          className="text-sm font-medium text-primary hover:underline"
        >
          Add driver
        </Link>
      </header>

      {drivers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No transport drivers yet.{" "}
          <Link
            href="/provider/transport/fleet/drivers/new"
            className="text-primary hover:underline"
          >
            Add your first driver
          </Link>{" "}
          to use dispatch.
        </p>
      ) : (
        <ul className="space-y-2">
          {drivers.map((d) => (
            <li key={d.id}>
              <Link
                href={`/provider/transport/fleet/drivers/${d.id}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/50"
              >
                <span className="font-medium">{d.displayName}</span>
                {!d.active ? (
                  <span className="text-xs text-muted-foreground">Inactive</span>
                ) : null}
                <FleetEligibilityBadge
                  dispatchReady={d.dispatchReady}
                  reasons={d.eligibilityReasons}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
