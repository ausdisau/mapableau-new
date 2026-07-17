import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicWorkOrdersPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Work orders"
      description="Coordinate inspection, repair, obstruction removal, and verification tasks while keeping completion separate from status restoration."
      rows={rowsForAccessOpsTopic("Work orders")}
    />
  );
}
