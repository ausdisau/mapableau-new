import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicSettingsPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="AccessOps settings"
      description="Check disabled-by-default feature flags, governance notices, and public-export boundaries."
      rows={rowsForAccessOpsTopic("Settings")}
    />
  );
}
