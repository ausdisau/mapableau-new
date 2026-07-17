import { requireApiPermission } from "@/lib/api/auth-handler";
import { approveDisclosure } from "@/lib/vault/disclosure-compiler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    const view = await approveDisclosure(body.disclosureId, user.id);
    if (!view) return vaultErrorResponse(new Error("VAULT_DISCLOSURE_NOT_FOUND"));
    return vaultOk({ view });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
