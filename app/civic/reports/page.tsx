import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicReportsPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="AccessOps reports"
      description="Prepare aggregate, privacy-safe operational reports for authorised assets and reliability windows."
      rows={rowsForAccessOpsTopic("Reports")}
    />
  );
}
