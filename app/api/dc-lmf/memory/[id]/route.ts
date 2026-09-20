import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  contestMemoryRecord,
  correctMemoryRecord,
  DcLmfError,
  revokeMemoryRecord,
} from "@/lib/dc-lmf/memory-service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    action: z.enum(["correct", "contest"]),
    payload: z.unknown().optional(),
    payloadRef: z.string().min(1).nullable().optional(),
    sourceRef: z.string().min(1).nullable().optional(),
    evidenceRefs: z.array(z.string().min(1)).optional(),
    reason: z.string().max(1000).optional(),
  })
  .strict();

function serviceError(error: unknown): Response {
  if (error instanceof DcLmfError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof Error) {
    return jsonError(error.message, 400);
  }
  return jsonError("DC_LMF_MEMORY_ERROR", 500);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`dc-lmf-memory-patch:${ip}`, {
      windowMs: 60_000,
      max: 30,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (error) {
    const parsed = jsonBodyErrorResponse(error);
    return jsonError(parsed.message, parsed.status);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    if (parsed.data.action === "contest") {
      await contestMemoryRecord({
        recordId: id,
        participantId: user.id,
        actorUserId: user.id,
        reason: parsed.data.reason,
      });
      return jsonOk({ id, status: "contested" as const });
    }

    if (parsed.data.payload === undefined && !parsed.data.payloadRef) {
      return jsonError("DC_LMF_CORRECTION_VALUE_REQUIRED", 400);
    }

    const record = await correctMemoryRecord({
      recordId: id,
      participantId: user.id,
      actorUserId: user.id,
      payload: parsed.data.payload,
      payloadRef: parsed.data.payloadRef,
      sourceRef: parsed.data.sourceRef,
      evidenceRefs: parsed.data.evidenceRefs,
      observedAt: new Date(),
    });
    return jsonOk({ record });
  } catch (error) {
    return serviceError(error);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`dc-lmf-memory-delete:${ip}`, {
      windowMs: 60_000,
      max: 20,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  try {
    await revokeMemoryRecord({
      recordId: id,
      participantId: user.id,
      actorUserId: user.id,
    });
    return jsonOk({ id, status: "revoked" as const });
  } catch (error) {
    return serviceError(error);
  }
}
