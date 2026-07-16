import { requireApiPermission } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";
import { isVaultDeletionEnabled } from "@/lib/vault/config";
import { VaultDisabledError } from "@/lib/vault/registry";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

type Params = { params: Promise<{ requestId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  if (!isVaultDeletionEnabled()) {
    return vaultErrorResponse(new VaultDisabledError("VAULT_DELETION_DISABLED"));
  }
  const { requestId } = await params;
  const request = await prisma.vaultDeletionRequest.findUnique({
    where: { id: requestId },
    include: { vault: true, receipts: true },
  });
  if (!request || request.vault.ownerUserId !== user.id) {
    return vaultErrorResponse(new Error("VAULT_DELETION_NOT_FOUND"));
  }
  return vaultOk({ request });
}
