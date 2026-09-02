import { submitQuickObservation } from "@/lib/access/experience/quick-observation-service";
import { accessExperienceFlags } from "@/lib/access/experience/flags";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { quickObservationSchema } from "@/types/access-map";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> },
) {
  if (!accessExperienceFlags.enabled) {
    return jsonError("Access Experience 2.0 is disabled", 404);
  }

  const { placeId } = await params;
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = quickObservationSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await submitQuickObservation({
      placeId,
      reporterId: user.id,
      observationType: parsed.data.observationType,
      value: parsed.data.value,
      note: parsed.data.note,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "PLACE_REPORT_ALREADY_SUBMITTED") {
      return jsonError(
        "You already reported this place recently; our team will review it",
        409,
      );
    }
    if (e instanceof Error && "status" in e && typeof e.status === "number") {
      return jsonError(e.message, e.status);
    }
    throw e;
  }
}
