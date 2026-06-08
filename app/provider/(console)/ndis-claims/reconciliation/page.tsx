import { NdisDirectClaimingClient } from "@/components/provider/ndis-claiming/NdisDirectClaimingClient";
import { NdiaRemittanceImportForm } from "@/components/provider/NdiaRemittanceImportForm";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Reconciliation | NDIS claiming | MapAble" };

export default async function ReconciliationPage() {
  const user = await requirePermission("provider:ndia:claim");
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0]!;
  return (
    <div className="space-y-6">
      <NdisDirectClaimingClient
        organisationId={organisationId}
        initialView="reconciliation"
      />
      <NdiaRemittanceImportForm organisationId={organisationId} />
    </div>
  );
}
