import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  saveParticipantPreferences,
  upsertParticipantProfile,
} from "@/lib/participants/participant-profile-service";
import { participantProfileSchema } from "@/lib/validation/participant";

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const parsed = participantProfileSchema.parse({
      displayName: body.displayName,
      preferredName: body.preferredName || null,
      homeSuburb: body.homeSuburb || null,
      homeState: body.homeState || null,
      participantNotes: body.participantNotes || null,
    });

    await upsertParticipantProfile(user.id, parsed, user.id);
    await saveParticipantPreferences(
      user.id,
      {
        mainSupportGoals: body.mainSupportGoals,
        accessNeedsSummary: body.accessNeedsSummary,
      },
      user.id
    );

    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Save failed", 500);
  }
}
