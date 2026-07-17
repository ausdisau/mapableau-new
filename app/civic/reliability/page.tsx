import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicReliabilityPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Reliability"
      description="Review feature-level reliability, unknown minutes, and evidence completeness without calculating a universal access score."
      rows={rowsForAccessOpsTopic("Reliability")}
    />
  );
}
