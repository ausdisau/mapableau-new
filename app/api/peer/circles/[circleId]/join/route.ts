import { jsonOk } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { joinPeerCircle } from "@/lib/peer/peer-circle-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  const { circleId } = await params;
  const member = await joinPeerCircle(ctx.profile.id, circleId);
  return jsonOk({ member }, 201);
}
