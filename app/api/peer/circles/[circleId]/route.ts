import { jsonError, jsonOk } from "@/lib/api/response";
import { requirePeerApiUser } from "@/lib/peer/api-helpers";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { getPeerCircle } from "@/lib/peer/peer-circle-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;

  const { circleId } = await params;
  const circle = await getPeerCircle(circleId);
  if (!circle) return jsonError("Circle not found", 404);

  return jsonOk({
    circle: {
      id: circle.id,
      title: circle.title,
      description: circle.description,
      topic: circle.topic,
      circleType: circle.circleType,
      accessibilityNotes: circle.accessibilityNotes,
      posts: circle.posts.map((p) => ({
        id: p.id,
        body: p.body,
        contentWarning: p.contentWarning,
        author: toPeerProfileDto(p.author, p.author.user),
        replyCount: p._count.replies,
        publishedAt: p.publishedAt,
      })),
    },
  });
}
