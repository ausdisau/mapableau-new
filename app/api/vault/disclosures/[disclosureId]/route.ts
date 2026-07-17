import { requireApiPermission } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";
import { isVaultSelectiveDisclosureEnabled } from "@/lib/vault/config";
import { VaultDisabledError } from "@/lib/vault/registry";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

type Params = { params: Promise<{ disclosureId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  if (!isVaultSelectiveDisclosureEnabled()) {
    return vaultErrorResponse(new VaultDisabledError("VAULT_SELECTIVE_DISCLOSURE_DISABLED"));
  }
  const { disclosureId } = await params;
  try {
    const view = await prisma.vaultDisclosureView.findUnique({
      where: { id: disclosureId },
      include: { vault: true, receipts: true },
    });
    if (!view || view.vault.ownerUserId !== user.id) {
      return vaultErrorResponse(new Error("VAULT_DISCLOSURE_NOT_FOUND"));
    }
    return vaultOk({ view });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
