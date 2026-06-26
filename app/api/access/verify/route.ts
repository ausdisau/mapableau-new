import { addAccessVerification } from "@/lib/access-verification/verification-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessVerificationSchema } from "@/lib/validation/access-report";

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

  const parsed = accessVerificationSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const verification = await addAccessVerification({
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    action: parsed.data.action,
    userId: user.id,
    notes: parsed.data.notes,
  });

  return jsonOk({ verification }, 201);
}
