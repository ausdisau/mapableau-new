import { createMarkerVerification } from "@/lib/access-markers/verification-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { verifyMarkerSchema } from "@/lib/validation/access-marker";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = verifyMarkerSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const { verification, aggregate } = await createMarkerVerification({
      placeId,
      userId: user.id,
      action: parsed.data.action,
      note: parsed.data.note,
      commentId: parsed.data.commentId,
      evidenceNote: parsed.data.evidenceNote,
    });
    return jsonOk(
      {
        verification: {
          id: verification.id,
          action: verification.action,
          createdAt: verification.createdAt,
        },
        aggregate,
      },
      201
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PLACE_NOT_FOUND") return jsonError("Place not found", 404);
    throw e;
  }
}
