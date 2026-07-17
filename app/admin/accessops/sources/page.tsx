import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsSourcesPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps sources"
      description="Admin view for source registry, conformance, licensing, trust level, and production activation status."
      rows={rowsForAccessOpsTopic("Sources")}
    />
  );
}
