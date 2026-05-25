import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { createMentorRequest } from "@/lib/peer/peer-mentor-service";
import { createPeerMentorRequestSchema } from "@/lib/validation/peer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  const { mentorId } = await params;
  try {
    const body = createPeerMentorRequestSchema.parse(await req.json());
    const request = await createMentorRequest(
      ctx.profile.id,
      mentorId,
      ctx.user.id,
      body
    );
    return jsonOk({ request: { id: request.id, status: request.status } }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not send request", 400);
  }
}
