import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { rowsForAccessOpsTopic } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ assetId: string }> };

export default async function CivicAssetDetailPage({ params }: PageParams) {
  await requireAuth();
  const { assetId } = await params;
  return (
    <AccessOpsPageShell
      title="Civic asset detail"
      description={`Operator-safe asset shell for ${assetId}. Private evidence, restricted geometry, and participant journeys are not shown.`}
      rows={rowsForAccessOpsTopic("Asset detail")}
    />
  );
}
