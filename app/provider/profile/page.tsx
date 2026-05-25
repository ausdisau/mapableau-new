import { ProviderProfileManager } from "@/components/admin-panels/provider/ProviderProfileManager";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import {
  getProviderDashboard,
  resolveProviderOrganisationId,
} from "@/lib/providers/provider-service";

export const metadata = { title: "Profile | Provider admin" };

export default async function ProviderProfilePage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const { org } = await getProviderDashboard(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider profile</h1>
      <ProviderProfileManager org={org} />
    </div>
  );
}
