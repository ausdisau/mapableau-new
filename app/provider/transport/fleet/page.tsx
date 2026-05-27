import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";

export default async function ProviderTransportFleetPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  if (orgIds.length === 0) {
    return <p>You need a provider organisation to manage fleet.</p>;
  }

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/provider/transport"
          className="text-sm text-primary hover:underline"
        >
          ← Transport
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Transport fleet</h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Manage verified drivers and accessible vehicles used on the dispatch
        board. Human dispatch only — fleet tools do not auto-assign trips.
      </p>
      <nav className="flex flex-wrap gap-4 text-sm font-medium">
        <Link
          href="/provider/transport/fleet/vehicles"
          className="text-primary hover:underline"
        >
          Vehicles
        </Link>
        <Link
          href="/provider/transport/fleet/drivers"
          className="text-primary hover:underline"
        >
          Drivers
        </Link>
        <Link
          href="/provider/transport/fleet/health"
          className="text-primary hover:underline"
        >
          Fleet health
        </Link>
        <Link
          href="/provider/transport/dispatch"
          className="text-primary hover:underline"
        >
          Dispatch board
        </Link>
      </nav>
    </div>
  );
}
