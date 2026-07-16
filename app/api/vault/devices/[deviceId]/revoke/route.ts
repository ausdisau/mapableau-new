import { requireApiPermission } from "@/lib/api/auth-handler";
import { revokeVaultDevice } from "@/lib/vault/devices";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

type Params = { params: Promise<{ deviceId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:device:manage:self");
  if (user instanceof Response) return user;
  const { deviceId } = await params;
  try {
    const device = await revokeVaultDevice(deviceId, user.id);
    if (!device) return vaultErrorResponse(new Error("VAULT_DEVICE_NOT_FOUND"));
    return vaultOk({ device });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
