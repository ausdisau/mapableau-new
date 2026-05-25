import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { upsertPeerMentorProfile } from "@/lib/peer/peer-mentor-service";
import { createPeerMentorProfileSchema } from "@/lib/validation/peer";

export async function POST(req: Request) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;
  try {
    const body = createPeerMentorProfileSchema.parse(await req.json());
    const mentor = await upsertPeerMentorProfile(
      ctx.user.id,
      ctx.profile.id,
      body
    );
    return jsonOk({ mentor: { id: mentor.id } }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not save mentor profile", 400);
  }
}
