import { ParticipantCaseloadTable } from "@/components/admin-panels/provider/ParticipantCaseloadTable";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import {
  getParticipantCaseload,
  resolveProviderOrganisationId,
} from "@/lib/providers/provider-service";

export const metadata = { title: "Participants | Provider admin" };

export default async function ProviderParticipantsPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const rows = await getParticipantCaseload(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Participants</h1>
      <ParticipantCaseloadTable
        rows={rows.map((r) => ({
          userId: r.userId,
          displayName: r.displayName,
          user: r.user,
        }))}
      />
    </div>
  );
}
