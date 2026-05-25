import { jsonOk } from "@/lib/api/response";
import { requirePeerModeratorApi } from "@/lib/peer/api-helpers";
import { listModerationQueue } from "@/lib/peer/peer-moderation-service";

export async function GET() {
  const user = await requirePeerModeratorApi();
  if (user instanceof Response) return user;
  const queue = await listModerationQueue();
  return jsonOk({ queue });
}
