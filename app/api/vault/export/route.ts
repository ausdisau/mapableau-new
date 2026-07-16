import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { createVaultExport } from "@/lib/vault/portability";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json().catch(() => ({}));
    const result = await createVaultExport({
      ownerUserId: user.id,
      itemIds: body.itemIds,
      includeLedgerSummary: body.includeLedgerSummary,
    });
    return vaultOk(result, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
