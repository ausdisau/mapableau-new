import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { getTransportVehicle } from "@/lib/transport/transport-fleet-service";
import { TransportVehicleFleetDetail } from "@/components/transport/TransportVehicleFleetDetail";

export default async function ProviderTransportVehicleFleetPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need to belong to a provider organisation.</p>;
  }

  const { vehicleId } = await params;
  const vehicle = await getTransportVehicle(user, organisationId, vehicleId);

  return (
    <TransportVehicleFleetDetail organisationId={organisationId} vehicle={vehicle} />
  );
}
