import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsIncidentsPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps incidents"
      description="Admin view for incident validation, acknowledgement, restoration evidence, closure review, and systemic flags."
      rows={rowsForAccessOpsTopic("Incidents")}
    />
  );
}
