import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { advanceImportQuarantine } from "@/lib/vault/portability";

type Params = { params: Promise<{ importId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  const { importId } = await params;
  try {
    // Approval path still quarantines until human provenance review completes.
    const record = await advanceImportQuarantine(importId, user.id);
    if (!record) return vaultErrorResponse(new Error("VAULT_IMPORT_NOT_FOUND"));
    return vaultOk({ import: record });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
