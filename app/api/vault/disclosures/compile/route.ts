import { requireApiPermission } from "@/lib/api/auth-handler";
import { persistCompiledDisclosure } from "@/lib/vault/disclosure-compiler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    const result = await persistCompiledDisclosure({
      ownerUserId: user.id,
      purposeCode: body.purposeCode,
      requestedFields: body.requestedFields ?? [],
      itemId: body.itemId,
      recipientLabel: body.recipientLabel,
      previousFields: body.previousFields,
    });
    return vaultOk(result, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
