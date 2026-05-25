import { prisma } from "@/lib/prisma";

export type AccessibilitySnapshot = {
  mobilityNeeds?: unknown;
  communicationPreferences?: unknown;
  sensoryPreferences?: unknown;
  transportRequirements?: unknown;
  summary?: string;
};

export async function buildAccessibilitySnapshot(
  participantId: string,
  summary?: string | null,
): Promise<AccessibilitySnapshot> {
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: participantId },
    select: {
      mobilityNeeds: true,
      communicationPreferences: true,
      sensoryPreferences: true,
      transportRequirements: true,
    },
  });

  if (!profile) return summary ? { summary } : {};

  return {
    mobilityNeeds: profile.mobilityNeeds,
    communicationPreferences: profile.communicationPreferences,
    sensoryPreferences: profile.sensoryPreferences,
    transportRequirements: profile.transportRequirements,
    summary: summary ?? undefined,
  };
}
