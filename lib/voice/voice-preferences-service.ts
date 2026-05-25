import { prisma } from "@/lib/prisma";

export async function getVoicePreferences(userId: string) {
  return prisma.voiceUserPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}
