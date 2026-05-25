import { QualityAndSafeguardsQueue } from "@/components/admin-panels/provider/QualityAndSafeguardsQueue";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { listProviderQualityQueue } from "@/lib/quality/quality-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Quality | Provider admin" };

export default async function ProviderQualityPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const signals = await listProviderQualityQueue(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Quality & safeguards</h1>
      <QualityAndSafeguardsQueue signals={signals} />
    </div>
  );
}
