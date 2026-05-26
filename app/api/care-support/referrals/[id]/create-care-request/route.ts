import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { CareSupportAccessError } from "@/lib/care-support/access-control";
import { createCareRequestFromReferral } from "@/lib/care-support/referral-service";
import { createCareRequestFromReferralSchema } from "@/schemas/care-support";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;

  try {
    const body = createCareRequestFromReferralSchema.parse(
      await req.json().catch(() => ({}))
    );
    const result = await createCareRequestFromReferral(id, user.id, body);
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof CareSupportAccessError) {
      const status = e.message === "NOT_FOUND" ? 404 : 403;
      return jsonError(e.message, status);
    }
    return jsonError("Create care request failed", 500);
  }
}
