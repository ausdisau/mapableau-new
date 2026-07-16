import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { listVaultLedger } from "@/lib/vault/ledger";

export async function GET(req: Request) {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const entries = await listVaultLedger(user.id, {
      itemId: url.searchParams.get("itemId") ?? undefined,
    });
    return vaultOk({ entries });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
