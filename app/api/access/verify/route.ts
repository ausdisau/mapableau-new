import { accessVerifySchema } from "@/lib/validation/access-alert";
import { submitVerification } from "@/lib/access-verification/verification-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = accessVerifySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const verification = await submitVerification({
      userId: user.id,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      action: parsed.data.action,
      notes: parsed.data.notes,
      evidence: parsed.data.evidence,
    });
    return jsonOk({ verification }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "VERIFY_RATE_LIMIT") {
      return jsonError("Too many verifications submitted recently", 429);
    }
    if (msg === "VERIFY_ALREADY_SUBMITTED") {
      return jsonError("You already submitted this verification", 409);
    }
    throw e;
  }
}
