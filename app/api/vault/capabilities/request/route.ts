import { requireApiPermission } from "@/lib/api/auth-handler";
import { requestVaultCapability } from "@/lib/vault/capabilities";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    const result = await requestVaultCapability({
      ownerUserId: user.id,
      purposeCode: body.purposeCode,
      requestedFields: body.requestedFields ?? [],
      itemId: body.itemId,
      recipientOrganisationId: body.recipientOrganisationId,
      recipientServiceId: body.recipientServiceId,
    });
    return vaultOk(result, result.capability ? 201 : 422);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
