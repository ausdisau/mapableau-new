import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getVaultItem,
  removeVaultItem,
  vaultErrorResponse,
} from "@/lib/privacy/participant-vault";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const item = await getVaultItem(user.id, id);
    return jsonOk({ item });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const result = await removeVaultItem(user.id, id);
    return jsonOk(result);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
