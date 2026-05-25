import { WorkforceVerificationMatrix } from "@/components/admin-panels/provider/WorkforceVerificationMatrix";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { getWorkforceVerificationMatrix } from "@/lib/verification/workforce-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Workforce | Provider admin" };

export default async function ProviderWorkforcePage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const workers = await getWorkforceVerificationMatrix(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Workforce</h1>
      <WorkforceVerificationMatrix workers={workers} />
    </div>
  );
}
