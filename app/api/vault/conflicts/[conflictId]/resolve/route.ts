import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { resolveVaultConflict } from "@/lib/vault/sync";

type Params = { params: Promise<{ conflictId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  const { conflictId } = await params;
  try {
    const body = await req.json();
    const conflict = await resolveVaultConflict({
      conflictId,
      ownerUserId: user.id,
      resolution: body.resolution ?? "participant_choice",
    });
    if (!conflict) return vaultErrorResponse(new Error("VAULT_CONFLICT_NOT_FOUND"));
    return vaultOk({ conflict });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
