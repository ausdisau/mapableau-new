import { ZodError } from "zod";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getVoicePreferences } from "@/lib/voice/voice-preferences-service";

const patchSchema = z.object({
  consentThirdPartyStt: z.boolean().optional(),
  voiceEnabled: z.boolean().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const prefs = await getVoicePreferences(user.id);
  return jsonOk({ preferences: prefs });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = patchSchema.parse(await req.json());
    const { prisma } = await import("@/lib/prisma");
    const prefs = await prisma.voiceUserPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    });
    return jsonOk({ preferences: prefs });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}
