import { ServiceLogReviewTable } from "@/components/admin-panels/provider/ServiceLogReviewTable";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { listServiceLogsForReview } from "@/lib/service-logs/service-log-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Service logs | Provider admin" };

export default async function ProviderServiceLogsPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const logs = await listServiceLogsForReview(user, orgId, "submitted");
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Service logs</h1>
      <ServiceLogReviewTable logs={logs} />
    </div>
  );
}
