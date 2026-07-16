import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { getTransportDriver } from "@/lib/transport/transport-fleet-service";
import { TransportDriverFleetDetail } from "@/components/transport/TransportDriverFleetDetail";

export default async function ProviderTransportDriverFleetPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return <p>You need to belong to a provider organisation.</p>;
  }

  const { driverId } = await params;
  const driver = await getTransportDriver(user, organisationId, driverId);

  return (
    <TransportDriverFleetDetail organisationId={organisationId} driver={driver} />
  );
}
