import { JobAndReferralQueue } from "@/components/admin-panels/provider/JobAndReferralQueue";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { listProviderJobs } from "@/lib/providers/quote-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Jobs | Provider admin" };

export default async function ProviderJobsPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const jobs = await listProviderJobs(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Jobs & referrals</h1>
      <JobAndReferralQueue jobs={jobs} />
    </div>
  );
}
