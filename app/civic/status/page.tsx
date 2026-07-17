import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicStatusPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Operational status"
      description="View current access status projections with stale, unknown, and conflict states labelled plainly."
      rows={rowsForAccessOpsTopic("Operational status")}
    />
  );
}
