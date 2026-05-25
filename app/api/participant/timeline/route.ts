import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listParticipantTimeline } from "@/lib/timeline/timeline-service";
import type { TimelineEventType } from "@prisma/client";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId") ?? user.id;
  const eventType = searchParams.get("eventType") as TimelineEventType | null;

  try {
    const events = await listParticipantTimeline(participantId, user, {
      eventType: eventType ?? undefined,
    });
    return jsonOk({ events });
  } catch {
    return jsonError("Forbidden", 403);
  }
}
