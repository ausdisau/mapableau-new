import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import {
  listVaultItems,
  registerReferenceItem,
} from "@/lib/vault/registry";

export async function GET() {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  try {
    const items = await listVaultItems(user.id);
    return vaultOk({ items });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = (await req.json()) as {
      itemType?: string;
      canonicalRecordId?: string;
      displayName?: string;
      purpose?: string;
    };
    if (!body.itemType) {
      return vaultErrorResponse(new Error("itemType is required"));
    }
    const result = await registerReferenceItem({
      ownerUserId: user.id,
      itemType: body.itemType,
      canonicalRecordId: body.canonicalRecordId,
      displayName: body.displayName,
      purpose: body.purpose,
    });
    return vaultOk(result, result.item ? 201 : 422);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
