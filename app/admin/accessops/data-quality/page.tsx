import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsDataQualityPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps data quality"
      description="Admin view for required fields, duplicates, conflicts, freshness, remediation, and restricted-geometry audits."
      rows={rowsForAccessOpsTopic("Data quality")}
    />
  );
}
