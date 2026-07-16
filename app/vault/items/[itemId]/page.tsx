import { notFound } from "next/navigation";

import { VaultNutritionLabelView } from "@/components/vault/VaultNutritionLabel";
import { requirePermission } from "@/lib/auth/guards";
import { isVaultItemRegistryEnabled } from "@/lib/vault/config";
import { buildNutritionLabel } from "@/lib/vault/nutrition-label";
import { getVaultItemForOwner } from "@/lib/vault/registry";

type Props = { params: Promise<{ itemId: string }> };

export default async function VaultItemDetailPage({ params }: Props) {
  const user = await requirePermission("vault:read:self");
  if (!isVaultItemRegistryEnabled()) {
    return <p>Vault item registry is disabled.</p>;
  }

  const { itemId } = await params;
  const item = await getVaultItemForOwner(itemId, user.id);
  if (!item) notFound();

  const label = buildNutritionLabel(item);

  return (
    <section className="space-y-4" aria-labelledby="item-detail-title">
      <h2 id="item-detail-title" className="sr-only">
        Item nutrition label
      </h2>
      <VaultNutritionLabelView label={label} />
      <p className="text-sm text-muted-foreground">
        Canonical domain: {item.canonicalDomain}. Routing is deterministic — AI
        cannot choose or override it. Use POST /api/vault/items/{item.id} to
        re-run routing when needed.
      </p>
    </section>
  );
}
