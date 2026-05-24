import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canAccessDispute } from "@/lib/disputes/access";
import { getDisputeById } from "@/lib/disputes/dispute-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) return jsonError("Not found", 404);

  const allowed = await canAccessDispute(user, dispute);
  if (!allowed) return jsonError("Forbidden", 403);

  return jsonOk({ dispute });
}
