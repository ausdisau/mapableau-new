import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { startRecovery } from "@/lib/vault/recovery";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json().catch(() => ({}));
    const request = await startRecovery({
      ownerUserId: user.id,
      trustedContactUserId: body.trustedContactUserId,
      rightsOfficerUserId: body.rightsOfficerUserId,
    });
    return vaultOk({ request }, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
