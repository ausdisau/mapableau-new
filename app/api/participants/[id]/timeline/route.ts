import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listParticipantTimeline } from "@/lib/timeline/timeline-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  try {
    const events = await listParticipantTimeline(id, user, {
      eventType: (searchParams.get("eventType") as never) ?? undefined,
    });
    return jsonOk({ events });
  } catch {
    return jsonError("Forbidden", 403);
  }
}
