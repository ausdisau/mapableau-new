import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  backfillAccessibilityProfileReference,
  getVaultOverview,
  VaultDisabledError,
} from "@/lib/vault/registry";
import { isVaultItemRegistryEnabled } from "@/lib/vault/config";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function GET() {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  if (!isVaultItemRegistryEnabled()) {
    return vaultErrorResponse(new VaultDisabledError());
  }
  try {
    await backfillAccessibilityProfileReference(user.id).catch(() => null);
    const overview = await getVaultOverview(user.id);
    return vaultOk(overview);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
