import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicDataSourcesPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Data sources"
      description="Inspect source trust, licence, conformance, and freshness before using access data in operations."
      rows={rowsForAccessOpsTopic("Data sources")}
    />
  );
}
