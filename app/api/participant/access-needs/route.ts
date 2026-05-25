import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  replaceAccessNeeds,
  saveParticipantPreferences,
} from "@/lib/participants/participant-profile-service";

export async function PUT(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const needs = Array.isArray(body.needs) ? body.needs : [];

  try {
    await replaceAccessNeeds(user.id, needs, user.id);
    if (body.accessNeedsSummary !== undefined) {
      await saveParticipantPreferences(
        user.id,
        { accessNeedsSummary: body.accessNeedsSummary },
        user.id
      );
    }
    return jsonOk({ ok: true });
  } catch {
    return jsonError("Save failed", 500);
  }
}
