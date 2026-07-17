import { requireApiPermission } from "@/lib/api/auth-handler";
import { listVaultDevices } from "@/lib/vault/devices";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function GET() {
  const user = await requireApiPermission("vault:device:manage:self");
  if (user instanceof Response) return user;
  try {
    return vaultOk({ devices: await listVaultDevices(user.id) });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
