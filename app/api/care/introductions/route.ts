import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listCareIntroductionsForParticipant,
  requestCareIntroduction,
} from "@/lib/care/introduction-service";
import { isCareIntroductionsEnabled } from "@/lib/config/care-pilot";

export const runtime = "nodejs";

const createSchema = z
  .object({
    careRequestId: z.string().min(1).optional(),
    candidateType: z.enum(["worker", "provider"]),
    candidateWorkerProfileId: z.string().min(1).optional(),
    candidateOrganisationId: z.string().min(1).optional(),
    lane: z.enum(["assured", "choice", "partner"]).optional(),
    messageToCandidate: z.string().max(2000).optional(),
    rankingCriteria: z.array(z.string().max(80)).max(20).optional(),
  })
  .strict();

export async function GET() {
  if (!isCareIntroductionsEnabled()) {
    return jsonError("CARE_INTRODUCTIONS_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const items = await listCareIntroductionsForParticipant(user.id);
    return jsonOk({ introductions: items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LIST_FAILED";
    return jsonError(message, 400);
  }
}

export async function POST(req: Request) {
  if (!isCareIntroductionsEnabled()) {
    return jsonError("CARE_INTRODUCTIONS_DISABLED", 403);
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const introduction = await requestCareIntroduction({
      participantId: user.id,
      requestedById: user.id,
      ...parsed.data,
    });
    return jsonOk({ introduction }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "CREATE_FAILED";
    return jsonError(message, 400);
  }
}
