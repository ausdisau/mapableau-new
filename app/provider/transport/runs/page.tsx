import Link from "next/link";

import { ProviderRideRunPlanner } from "@/components/transport/ProviderRideRunPlanner";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { isTransportRidePoolingEnabled } from "@/lib/config/transport-accessible";

export default async function ProviderTransportRunsPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];

  if (!isTransportRidePoolingEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Ride pooling</h1>
        <p className="text-sm text-muted-foreground">
          Ride pooling is disabled. Set TRANSPORT_RIDE_POOLING_ENABLED=true to use
          the run planner.
        </p>
        <Link href="/provider/transport/dispatch" className="text-primary underline text-sm">
          Go to dispatch board
        </Link>
      </div>
    );
  }

  if (!organisationId) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Ride pooling</h1>
        <p>You need an organisation membership to plan shared runs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          ← Transport
        </Link>
      </p>
      <header>
        <h1 className="font-heading text-2xl font-bold">Ride run planner</h1>
        <p className="text-sm text-muted-foreground">
          Pool multiple participant trips on one vehicle. Stop order optimisation
          remains advisory until a dispatcher locks the run.
        </p>
      </header>
      <ProviderRideRunPlanner organisationId={organisationId} />
    </div>
  );
}
