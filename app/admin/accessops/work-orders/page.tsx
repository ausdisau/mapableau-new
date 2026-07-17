import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsWorkOrdersPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps work orders"
      description="Admin view for work-order state, completion, verification, overdue items, and maintenance ownership."
      rows={rowsForAccessOpsTopic("Work orders")}
    />
  );
}
