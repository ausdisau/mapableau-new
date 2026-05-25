import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { exportParticipantTimeline } from "@/lib/timeline/timeline-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const record = await exportParticipantTimeline({
    participantId: body.participantId ?? user.id,
    exportedById: user.id,
    format: body.format ?? "json",
  });
  return jsonOk({ export: record });
}
