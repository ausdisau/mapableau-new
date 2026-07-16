import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { completeRecovery } from "@/lib/vault/recovery";

type Params = { params: Promise<{ requestId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  const { requestId } = await params;
  try {
    const result = await completeRecovery({
      requestId,
      actorUserId: user.id,
    });
    if (!result) return vaultErrorResponse(new Error("VAULT_RECOVERY_NOT_FOUND"));
    return vaultOk(result);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
