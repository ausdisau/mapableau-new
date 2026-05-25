import { jsonOk } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { leavePeerCircle } from "@/lib/peer/peer-circle-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  const { circleId } = await params;
  await leavePeerCircle(ctx.profile.id, circleId);
  return jsonOk({ left: true });
}
