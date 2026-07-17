import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsAssetsPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps assets"
      description="Admin view for asset lifecycle, ownership references, publication readiness, and graph membership."
      rows={rowsForAccessOpsTopic("Assets")}
    />
  );
}
