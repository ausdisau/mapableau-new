import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { notifyCapacityMatch } from "@/lib/capacity/capacity-matching-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const match = await notifyCapacityMatch(id, user.id);
  return jsonOk({ match });
}
