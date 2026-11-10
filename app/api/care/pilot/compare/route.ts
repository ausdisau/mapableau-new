import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { compareCareSupportOptions } from "@/lib/care/pilot-spine";
import { isCareCompareEnabled } from "@/lib/config/care-pilot";

export const runtime = "nodejs";

const compareSchema = z
  .object({
    careRequestId: z.string().min(1).optional(),
    orderedCandidateIds: z.array(z.string().min(1)).min(1).max(20),
    candidates: z
      .array(
        z
          .object({
            candidateId: z.string().min(1),
            candidateType: z.enum(["worker", "provider"]),
            displayName: z.string().min(1).max(200),
            lane: z.enum(["assured", "choice", "partner"]).optional(),
            fitReasons: z.array(z.string().max(200)).max(10).optional(),
            missingEvidence: z.array(z.string().max(200)).max(10).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();

export async function POST(req: Request) {
  if (!isCareCompareEnabled()) {
    return jsonError("CARE_COMPARE_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = compareSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await compareCareSupportOptions({
      participantId: user.id,
      actorUserId: user.id,
      careRequestId: parsed.data.careRequestId,
      orderedCandidateIds: parsed.data.orderedCandidateIds,
      candidates: parsed.data.candidates,
    });
    return jsonOk(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "COMPARE_FAILED";
    return jsonError(message, 400);
  }
}
