import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { getVaultExport } from "@/lib/vault/portability";

type Params = { params: Promise<{ exportId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  const { exportId } = await params;
  try {
    const result = await getVaultExport(exportId, user.id);
    if (!result) return vaultErrorResponse(new Error("VAULT_EXPORT_NOT_FOUND"));
    return vaultOk(result);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
