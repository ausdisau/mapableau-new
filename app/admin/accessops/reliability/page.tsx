import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsReliabilityPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps reliability"
      description="Admin view for availability windows, evidence completeness, unknown minutes, and unplanned outage summaries."
      rows={rowsForAccessOpsTopic("Reliability")}
    />
  );
}
