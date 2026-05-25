import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { upsertParticipantPreferences } from "@/lib/foods/preferences-service";
import { preferencesSchema } from "@/lib/validation/foods";

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const prefs = await upsertParticipantPreferences(user.id, parsed.data);
  return jsonOk({ preferences: prefs });
}
