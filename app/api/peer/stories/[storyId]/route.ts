import { jsonError, jsonOk } from "@/lib/api/response";
import { requirePeerApiUser } from "@/lib/peer/api-helpers";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { getPeerStory } from "@/lib/peer/peer-story-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;
  const { storyId } = await params;
  const story = await getPeerStory(storyId);
  if (!story) return jsonError("Not found", 404);
  return jsonOk({
    story: {
      id: story.id,
      title: story.title,
      body: story.body,
      resourceUrl: story.resourceUrl,
      contentWarning: story.contentWarning,
      author: story.author
        ? toPeerProfileDto(story.author, story.author.user)
        : null,
    },
  });
}
