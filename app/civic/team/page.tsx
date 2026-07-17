import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicTeamPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="AccessOps team"
      description="Review operator roles, escalation coverage, and authorised asset boundaries for the civic access team."
      rows={rowsForAccessOpsTopic("Team access")}
    />
  );
}
