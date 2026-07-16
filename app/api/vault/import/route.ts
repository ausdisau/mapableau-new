import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { receiveVaultImport } from "@/lib/vault/portability";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json().catch(() => ({}));
    const record = await receiveVaultImport({
      ownerUserId: user.id,
      sourceLabel: body.sourceLabel,
      manifestJson: body.manifestJson,
    });
    return vaultOk({ import: record }, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
