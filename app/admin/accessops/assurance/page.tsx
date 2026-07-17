import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsAssurancePage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps assurance"
      description="Admin view for publication gates, routing gates, evidence expiry, and controls that can restrict public claims."
      rows={rowsForAccessOpsTopic("Assurance")}
    />
  );
}
