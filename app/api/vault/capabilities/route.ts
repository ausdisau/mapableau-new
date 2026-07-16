import { requireApiPermission } from "@/lib/api/auth-handler";
import { listVaultCapabilities } from "@/lib/vault/capabilities";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function GET() {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  try {
    return vaultOk({ capabilities: await listVaultCapabilities(user.id) });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
