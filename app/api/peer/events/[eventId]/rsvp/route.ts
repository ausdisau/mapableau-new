import { jsonOk } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { rsvpPeerEvent } from "@/lib/peer/peer-event-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  const { eventId } = await params;
  const rsvp = await rsvpPeerEvent(ctx.profile.id, eventId, ctx.user.id);
  return jsonOk({ rsvp }, 201);
}
