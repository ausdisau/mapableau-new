import Link from "next/link";

import { FleetVehicleEditor } from "@/components/transport/FleetVehicleEditor";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { listLegacyVehiclesForLink } from "@/lib/transport/transport-fleet-read-service";

export default async function NewFleetVehiclePage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation to add fleet vehicles.</p>;
  }

  const legacyVehicles = await listLegacyVehiclesForLink(organisationId);

  return (
    <div className="space-y-4">
      <p>
        <Link
          href="/provider/transport/fleet/vehicles"
          className="text-sm text-primary hover:underline"
        >
          ← Vehicles
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Add fleet vehicle</h1>
      <FleetVehicleEditor
        organisationId={organisationId}
        mode="create"
        legacyVehicles={legacyVehicles}
      />
    </div>
  );
}
