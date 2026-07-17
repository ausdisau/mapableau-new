import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { startVaultSync } from "@/lib/vault/sync";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json().catch(() => ({}));
    const operation = await startVaultSync({
      ownerUserId: user.id,
      deviceId: body.deviceId,
    });
    return vaultOk({ operation }, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
