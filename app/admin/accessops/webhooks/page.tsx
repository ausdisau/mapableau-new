import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsWebhooksPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps webhooks"
      description="Admin view for webhook subscriptions, retry readiness, destination safety, and disabled production delivery gates."
      rows={rowsForAccessOpsTopic("Webhooks")}
    />
  );
}
