import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import {
  getVaultItemForOwner,
  rerouteVaultItem,
} from "@/lib/vault/registry";

type Params = { params: Promise<{ itemId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  const { itemId } = await params;
  try {
    const item = await getVaultItemForOwner(itemId, user.id);
    if (!item) return vaultErrorResponse(new Error("VAULT_ITEM_NOT_FOUND"));
    return vaultOk({ item });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}

/** Deterministic re-route (canonical router). Alias for POST .../route in the plan. */
export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  const { itemId } = await params;
  try {
    const result = await rerouteVaultItem(itemId, user.id);
    if (!result) return vaultErrorResponse(new Error("VAULT_ITEM_NOT_FOUND"));
    return vaultOk(result);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
