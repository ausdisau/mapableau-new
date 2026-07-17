import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { listVaultConflicts } from "@/lib/vault/sync";

export async function GET() {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  try {
    return vaultOk({ conflicts: await listVaultConflicts(user.id) });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
