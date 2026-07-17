import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsStatusPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps status"
      description="Admin view for operational status projections, conflicts, freshness deadlines, and verification state."
      rows={rowsForAccessOpsTopic("Status")}
    />
  );
}
