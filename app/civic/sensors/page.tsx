import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicSensorsPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Sensors"
      description="Monitor read-only sensor health and observations. AccessOps never actuates lifts, doors, gates, or kerb infrastructure."
      rows={rowsForAccessOpsTopic("Sensors")}
    />
  );
}
