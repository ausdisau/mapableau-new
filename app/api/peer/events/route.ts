import { jsonOk } from "@/lib/api/response";
import { requirePeerApiUser } from "@/lib/peer/api-helpers";
import { listPeerEvents } from "@/lib/peer/peer-event-service";

export async function GET() {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;
  const events = await listPeerEvents();
  return jsonOk({ events });
}
