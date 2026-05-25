import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  listPhrasesForProfile,
  replacePhrasesForProfile,
} from "@/lib/aac/aac-phrase-service";
import { updateAacPhrasesSchema } from "@/lib/validation/aac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
    select: { communicationPreferences: true },
  });
  const prefs = (profile?.communicationPreferences as string[]) ?? [];
  const phrases = await listPhrasesForProfile(user.id);

  return jsonOk({
    phrases,
    showAacByDefault: prefs.includes("aac"),
    communicationPreferences: prefs,
  });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = updateAacPhrasesSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Phrase list is not valid.", 400);
  }

  const phrases = await replacePhrasesForProfile(user.id, parsed.data.phrases);
  return jsonOk({ phrases });
}
