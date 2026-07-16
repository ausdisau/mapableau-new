import Link from "next/link";

import { TransportFleetPanel } from "@/components/transport/TransportFleetPanel";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import {
  listTransportDrivers,
  listTransportVehicles,
} from "@/lib/transport/transport-fleet-service";

export default async function ProviderTransportFleetPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need to belong to a provider organisation to manage fleet.</p>;
  }

  const [drivers, vehicles] = await Promise.all([
    listTransportDrivers(user, organisationId),
    listTransportVehicles(user, organisationId),
  ]);

  return (
    <div className="space-y-4">
      <p>
        <Link href="/provider/transport/dispatch" className="text-sm text-primary hover:underline">
          ← Dispatch
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Dispatch fleet</h1>
      <p className="text-sm text-muted-foreground">
        Manage driver and vehicle verification before dispatch. Eligibility is enforced when you assign a trip.
      </p>
      <TransportFleetPanel
        organisationId={organisationId}
        initialDrivers={drivers}
        initialVehicles={vehicles}
      />
    </div>
  );
}
