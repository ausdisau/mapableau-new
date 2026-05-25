import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { createCircleReply } from "@/lib/peer/peer-post-service";
import { createPeerReplySchema } from "@/lib/validation/peer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  const { postId } = await params;

  try {
    const body = createPeerReplySchema.parse(await req.json());
    const reply = await createCircleReply(
      ctx.profile.id,
      postId,
      ctx.user.id,
      body
    );
    return jsonOk({ reply: { id: reply.id, body: reply.body, status: reply.status } }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create reply", 400);
  }
}
