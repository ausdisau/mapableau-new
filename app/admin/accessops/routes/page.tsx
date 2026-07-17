import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsRoutesPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps routes"
      description="Admin view for advisory route graph coverage, hard constraints, uncertainty, and reroute continuity signals."
      rows={rowsForAccessOpsTopic("Routes")}
    />
  );
}
