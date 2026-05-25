import { ProviderAnalyticsDashboard } from "@/components/admin-panels/provider/ProviderAnalyticsDashboard";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { getProviderDashboard } from "@/lib/providers/provider-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Reports | Provider admin" };

export default async function ProviderReportsPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const { actionQueue } = await getProviderDashboard(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Reports</h1>
      <ProviderAnalyticsDashboard metrics={actionQueue} />
    </div>
  );
}
