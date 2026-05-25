import { CapacityExchangePanel } from "@/components/admin-panels/provider/CapacityExchangePanel";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { getCapacityExchange } from "@/lib/capacity/capacity-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Capacity | Provider admin" };

export default async function ProviderCapacityPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const { blocks, waitlist } = await getCapacityExchange(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Capacity exchange</h1>
      <CapacityExchangePanel blocks={blocks} waitlistCount={waitlist.length} />
    </div>
  );
}
