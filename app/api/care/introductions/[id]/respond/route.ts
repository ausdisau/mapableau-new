import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { respondToCareIntroduction } from "@/lib/care/introduction-service";
import { isCareIntroductionsEnabled } from "@/lib/config/care-pilot";

export const runtime = "nodejs";

const respondSchema = z
  .object({
    decision: z.enum(["accepted", "declined"]),
    responseNote: z.string().max(2000).optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isCareIntroductionsEnabled()) {
    return jsonError("CARE_INTRODUCTIONS_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const introduction = await respondToCareIntroduction({
      introductionId: id,
      actorUserId: user.id,
      decision: parsed.data.decision,
      responseNote: parsed.data.responseNote,
    });
    return jsonOk({ introduction });
  } catch (err) {
    const message = err instanceof Error ? err.message : "RESPOND_FAILED";
    return jsonError(message, 400);
  }
}
