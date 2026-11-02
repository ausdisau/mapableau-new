import { ZodError } from "zod";

import { confirmIntentDelivery } from "@/lib/adtunis/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { adtunisConfig } from "@/lib/config/adtunis";
import { AdtunisActionError } from "@mapable/adtunis-core";

export async function POST(req: Request) {
  if (!adtunisConfig.enabled) {
    return jsonError("Adtunis is not enabled in this environment.", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const idempotencyKey =
      req.headers.get("idempotency-key")?.trim() || body.idempotencyKey;
    const result = await confirmIntentDelivery({
      participantId: user.id,
      body: { ...body, idempotencyKey },
    });
    return jsonOk(result, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof AdtunisActionError) {
      return jsonError(error.message, error.status);
    }
    return jsonError(
      error instanceof Error ? error.message : "Confirmation failed.",
      400,
    );
  }
}
