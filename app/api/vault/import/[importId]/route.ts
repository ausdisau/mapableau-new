import { requireApiPermission } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";
import { isVaultImportEnabled } from "@/lib/vault/config";
import { VaultDisabledError } from "@/lib/vault/registry";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

type Params = { params: Promise<{ importId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  if (!isVaultImportEnabled()) {
    return vaultErrorResponse(new VaultDisabledError("VAULT_IMPORT_DISABLED"));
  }
  const { importId } = await params;
  const record = await prisma.vaultImport.findUnique({
    where: { id: importId },
    include: { vault: true, findings: true },
  });
  if (!record || record.vault.ownerUserId !== user.id) {
    return vaultErrorResponse(new Error("VAULT_IMPORT_NOT_FOUND"));
  }
  return vaultOk({ import: record });
}
