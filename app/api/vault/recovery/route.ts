import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { getRecoveryConfiguration } from "@/lib/vault/recovery";

export async function GET() {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  try {
    return vaultOk({ configuration: await getRecoveryConfiguration(user.id) });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
