import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { toPeerProfileDto } from "@/lib/peer/dto";
import { createCirclePost } from "@/lib/peer/peer-post-service";
import { createPeerCirclePostSchema } from "@/lib/validation/peer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  const { circleId } = await params;

  try {
    const body = createPeerCirclePostSchema.parse(await req.json());
    const post = await createCirclePost(
      ctx.profile.id,
      circleId,
      ctx.user.id,
      body
    );
    return jsonOk(
      {
        post: {
          id: post.id,
          body: post.body,
          status: post.status,
          author: toPeerProfileDto(post.author, post.author.user),
        },
      },
      201
    );
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create post", 400);
  }
}
