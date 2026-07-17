import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsFeedsPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps feeds"
      description="Admin view for external feed readiness. External feeds remain disabled by default and are not activated from this page."
      rows={rowsForAccessOpsTopic("Feeds")}
    />
  );
}
