import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicIncidentsPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Access incidents"
      description="Track reported disruptions and restoration evidence without publishing accusations or reporter identity."
      rows={rowsForAccessOpsTopic("Incident lifecycle")}
    />
  );
}
