import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsPartnersPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps partners"
      description="Admin view for partner API client keys, scopes, tenant boundaries, and safe DTO projections."
      rows={rowsForAccessOpsTopic("Partners")}
    />
  );
}
