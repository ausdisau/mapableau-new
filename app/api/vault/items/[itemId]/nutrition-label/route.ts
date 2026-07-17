import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { buildNutritionLabel } from "@/lib/vault/nutrition-label";
import { getVaultItemForOwner } from "@/lib/vault/registry";

type Params = { params: Promise<{ itemId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  const { itemId } = await params;
  try {
    const item = await getVaultItemForOwner(itemId, user.id);
    if (!item) return vaultErrorResponse(new Error("VAULT_ITEM_NOT_FOUND"));
    return vaultOk({ label: buildNutritionLabel(item) });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
