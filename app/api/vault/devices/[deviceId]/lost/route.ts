import { requireApiPermission } from "@/lib/api/auth-handler";
import { markVaultDeviceLost } from "@/lib/vault/devices";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

type Params = { params: Promise<{ deviceId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:device:manage:self");
  if (user instanceof Response) return user;
  const { deviceId } = await params;
  try {
    const result = await markVaultDeviceLost(deviceId, user.id);
    if (!result) return vaultErrorResponse(new Error("VAULT_DEVICE_NOT_FOUND"));
    return vaultOk(result);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
