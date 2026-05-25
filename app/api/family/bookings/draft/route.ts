import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { createBookingDraft } from "@/lib/family/supported-decision-service";
import { bookingDraftSchema } from "@/lib/validation/family";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = bookingDraftSchema.parse(await req.json());
    const result = await createBookingDraft({
      nomineeId: user.id,
      participantId: body.participantId,
      bookingType: body.bookingType,
      requestedStart: new Date(body.requestedStart),
      notes: body.notes,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "SCOPE_MISSING") {
      return jsonError(accessDeniedMessage("scope_missing"), 403);
    }
    return jsonError("Could not create booking draft", 400);
  }
}
