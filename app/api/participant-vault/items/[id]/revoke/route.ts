import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  revokeVaultShare,
  revokeVaultShareSchema,
  vaultErrorResponse,
} from "@/lib/privacy/participant-vault";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const parsed = revokeVaultShareSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await revokeVaultShare(user.id, id, parsed.data.grantId);
    return jsonOk(result);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
