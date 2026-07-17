import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicAssetsPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Civic assets"
      description="Review authorised lifts, ramps, toilets, kerb ramps, transit stops, and other civic access assets without exposing restricted geometry."
      rows={rowsForAccessOpsTopic("Authorised assets")}
    />
  );
}
