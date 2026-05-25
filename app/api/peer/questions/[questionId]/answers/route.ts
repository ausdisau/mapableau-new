import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { createPeerAnswer } from "@/lib/peer/peer-question-service";
import { createPeerAnswerSchema } from "@/lib/validation/peer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  const { questionId } = await params;
  try {
    const body = createPeerAnswerSchema.parse(await req.json());
    const answer = await createPeerAnswer(
      ctx.profile.id,
      questionId,
      ctx.user.id,
      body
    );
    return jsonOk({ answer: { id: answer.id, status: answer.status } }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create answer", 400);
  }
}
