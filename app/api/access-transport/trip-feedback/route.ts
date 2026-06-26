import { submitTripAccessFeedback } from "@/lib/access-transport/trip-feedback-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessTripFeedbackSchema } from "@/types/access-transport";

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

  const parsed = accessTripFeedbackSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const feedback = await submitTripAccessFeedback({
      ...parsed.data,
      submittedById: user.id,
    });
    return jsonOk({ feedback }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "TRIP_NOT_FOUND") return jsonError("Trip not found", 404);
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    throw e;
  }
}
