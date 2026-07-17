import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { requestVaultDeletion } from "@/lib/vault/portability";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    const result = await requestVaultDeletion({
      ownerUserId: user.id,
      itemId: body.itemId,
      scopes: body.scopes ?? ["vault_index"],
      note: body.note,
    });
    return vaultOk(result, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
