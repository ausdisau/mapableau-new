import { requireApiPermission } from "@/lib/api/auth-handler";
import { registerVaultDevice } from "@/lib/vault/devices";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:device:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    const device = await registerVaultDevice({
      ownerUserId: user.id,
      deviceLabel: body.deviceLabel ?? "Device",
      platform: body.platform,
      devicePublicKey: body.devicePublicKey,
      localVaultEligible: Boolean(body.localVaultEligible),
      offlineCategories: body.offlineCategories,
    });
    return vaultOk({ device }, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
