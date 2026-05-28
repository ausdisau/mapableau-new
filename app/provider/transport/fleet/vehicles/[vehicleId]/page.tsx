import Link from "next/link";
import { notFound } from "next/navigation";

import { FleetVehicleEditor } from "@/components/transport/FleetVehicleEditor";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { getFleetVehicle } from "@/lib/transport/transport-fleet-read-service";

export default async function FleetVehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation.</p>;
  }

  const { vehicleId } = await params;
  const vehicle = await getFleetVehicle(organisationId, vehicleId);
  if (!vehicle) notFound();

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
      <h1 className="font-heading text-2xl font-bold">{vehicle.displayName}</h1>
      {vehicle.activeAssignmentCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {vehicle.activeAssignmentCount} active trip assignment
          {vehicle.activeAssignmentCount === 1 ? "" : "s"}.
        </p>
      ) : null}
      <FleetVehicleEditor
        organisationId={organisationId}
        mode="edit"
        initial={{
          id: vehicle.id,
          displayName: vehicle.displayName,
          registrationNumber: vehicle.registrationNumber,
          active: vehicle.active,
          vehicleId: vehicle.vehicleId,
          features: vehicle.features,
          verifications: vehicle.verifications,
          dispatchReady: vehicle.dispatchReady,
          eligibilityReasons: vehicle.eligibilityReasons,
        }}
      />
    </div>
  );
}
