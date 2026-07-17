import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicWebhooksPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Webhooks"
      description="Review partner webhook readiness. Production delivery remains disabled unless explicitly enabled outside this shell."
      rows={rowsForAccessOpsTopic("Webhooks")}
    />
  );
}
