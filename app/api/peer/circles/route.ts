import { jsonOk } from "@/lib/api/response";
import { requirePeerApiUser } from "@/lib/peer/api-helpers";
import { listPeerCircles } from "@/lib/peer/peer-circle-service";

export async function GET() {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;
  const circles = await listPeerCircles();
  return jsonOk({
    circles: circles.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      topic: c.topic,
      circleType: c.circleType,
      memberCount: c._count.members,
    })),
  });
}
