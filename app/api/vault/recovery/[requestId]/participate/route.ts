import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { participateInRecovery } from "@/lib/vault/recovery";

type Params = { params: Promise<{ requestId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:recovery:participate");
  if (user instanceof Response) return user;
  const { requestId } = await params;
  try {
    const body = await req.json();
    const request = await participateInRecovery({
      requestId,
      actorUserId: user.id,
      role: body.role,
    });
    if (!request) return vaultErrorResponse(new Error("VAULT_RECOVERY_NOT_FOUND"));
    return vaultOk({ request });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
