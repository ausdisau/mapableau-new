import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsOpenDataPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps open data"
      description="Admin view for OGC API Features exports, privacy filtering, licence checks, and disabled-by-default publication gates."
      rows={rowsForAccessOpsTopic("Open data")}
    />
  );
}
