import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerApiUser, requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { createPeerStory, listPeerStories } from "@/lib/peer/peer-story-service";
import { createPeerStorySchema } from "@/lib/validation/peer";

export async function GET() {
  const user = await requirePeerApiUser();
  if (user instanceof Response) return user;
  const stories = await listPeerStories();
  return jsonOk({
    stories: stories.map((s) => ({
      id: s.id,
      title: s.title,
      contentWarning: s.contentWarning,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  try {
    const body = createPeerStorySchema.parse(await req.json());
    const story = await createPeerStory(ctx.profile.id, ctx.user.id, body);
    return jsonOk({ story: { id: story.id, status: story.status } }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not submit story", 400);
  }
}
