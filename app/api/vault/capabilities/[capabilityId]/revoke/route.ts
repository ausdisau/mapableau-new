import { requireApiPermission } from "@/lib/api/auth-handler";
import { revokeVaultCapability } from "@/lib/vault/capabilities";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

type Params = { params: Promise<{ capabilityId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  const { capabilityId } = await params;
  try {
    const capability = await revokeVaultCapability(capabilityId, user.id);
    if (!capability) return vaultErrorResponse(new Error("VAULT_CAPABILITY_NOT_FOUND"));
    return vaultOk({ capability });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
