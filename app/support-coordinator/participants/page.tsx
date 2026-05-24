import { CaseloadTable } from "@/components/support-coordinator/CaseloadTable";
import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { requirePermission } from "@/lib/auth/guards";
import { getCoordinatorCaseload } from "@/lib/support-coordination/support-coordination-service";

export default async function SupportCoordinatorParticipantsPage() {
  const user = await requirePermission("coordinator:portal");
  const caseload = await getCoordinatorCaseload(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="font-heading text-2xl font-bold">Participants</h1>
      <MapAbleCard description="Consent-gated participant list">
        <CaseloadTable rows={caseload} />
      </MapAbleCard>
    </div>
  );
}
