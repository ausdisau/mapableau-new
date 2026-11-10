import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { linkTransportRequirementsToCareRequest } from "@/lib/care/pilot-spine";
import { isCareTransportLinkEnabled } from "@/lib/config/care-pilot";

export const runtime = "nodejs";

const transportLinkSchema = z
  .object({
    careRequestId: z.string().min(1),
    pickupNotes: z.string().max(1000).optional(),
    accessRequirements: z.string().max(1000).optional(),
    bufferMinutes: z.number().int().min(0).max(180).optional(),
  })
  .strict();

/**
 * Transport link only — requirements + buffer. No dispatch.
 */
export async function POST(req: Request) {
  if (!isCareTransportLinkEnabled()) {
    return jsonError("CARE_TRANSPORT_LINK_DISABLED", 403);
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

  const parsed = transportLinkSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await linkTransportRequirementsToCareRequest({
      careRequestId: parsed.data.careRequestId,
      participantId: user.id,
      actorUserId: user.id,
      pickupNotes: parsed.data.pickupNotes,
      accessRequirements: parsed.data.accessRequirements,
      bufferMinutes: parsed.data.bufferMinutes,
    });
    return jsonOk(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "TRANSPORT_LINK_FAILED";
    return jsonError(message, 400);
  }
}
