import Link from "next/link";

import { FleetEligibilityBadge } from "@/components/transport/FleetEligibilityBadge";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { listFleetVehicles } from "@/lib/transport/transport-fleet-read-service";

export default async function FleetVehiclesPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation to manage fleet vehicles.</p>;
  }

  const vehicles = await listFleetVehicles(organisationId);

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
        <h1 className="font-heading text-2xl font-bold">Fleet vehicles</h1>
        <Link
          href="/provider/transport/fleet/vehicles/new"
          className="text-sm font-medium text-primary hover:underline"
        >
          Add vehicle
        </Link>
      </header>

      {vehicles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No transport vehicles yet.{" "}
          <Link
            href="/provider/transport/fleet/vehicles/new"
            className="text-primary hover:underline"
          >
            Add your first vehicle
          </Link>{" "}
          to use dispatch.
        </p>
      ) : (
        <ul className="space-y-2">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link
                href={`/provider/transport/fleet/vehicles/${v.id}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/50"
              >
                <span className="font-medium">{v.displayName}</span>
                {!v.active ? (
                  <span className="text-xs text-muted-foreground">Inactive</span>
                ) : null}
                <FleetEligibilityBadge
                  dispatchReady={v.dispatchReady}
                  reasons={v.eligibilityReasons}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
