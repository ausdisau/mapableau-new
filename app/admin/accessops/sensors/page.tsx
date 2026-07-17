import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsSensorsPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps sensors"
      description="Admin view for sensor health, trust, calibration, suspended devices, and the no-actuation posture."
      rows={rowsForAccessOpsTopic("Sensors")}
    />
  );
}
