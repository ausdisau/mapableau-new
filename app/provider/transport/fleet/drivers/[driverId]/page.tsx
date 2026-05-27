import Link from "next/link";
import { notFound } from "next/navigation";

import { FleetDriverEditor } from "@/components/transport/FleetDriverEditor";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { getFleetDriver } from "@/lib/transport/transport-fleet-read-service";

export default async function FleetDriverDetailPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need a provider organisation.</p>;
  }

  const { driverId } = await params;
  const driver = await getFleetDriver(organisationId, driverId);
  if (!driver) notFound();

  return (
    <div className="space-y-4">
      <p>
        <Link
          href="/provider/transport/fleet/drivers"
          className="text-sm text-primary hover:underline"
        >
          ← Drivers
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">{driver.displayName}</h1>
      {driver.activeAssignmentCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {driver.activeAssignmentCount} active trip assignment
          {driver.activeAssignmentCount === 1 ? "" : "s"}.
        </p>
      ) : null}
      <FleetDriverEditor
        organisationId={organisationId}
        mode="edit"
        initial={{
          id: driver.id,
          displayName: driver.displayName,
          active: driver.active,
          userId: driver.userId,
          driverProfileId: driver.driverProfileId,
          verifications: driver.verifications,
          dispatchReady: driver.dispatchReady,
          eligibilityReasons: driver.eligibilityReasons,
        }}
      />
    </div>
  );
}
