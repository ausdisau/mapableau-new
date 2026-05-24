import { prisma } from "@/lib/prisma";

export type AccessibilitySnapshot = {
  communicationPreferences?: string[];
  mobilityNotes?: string;
  sensoryNotes?: string;
  supportAnimal?: boolean;
};

/**
 * Builds a minimum-field accessibility snapshot for provider-facing share.
 */
export async function buildParticipantAccessibilitySnapshot(
  participantId: string,
): Promise<AccessibilitySnapshot | null> {
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: participantId },
    select: {
      communicationPreferences: true,
      mobilityNeeds: true,
      sensoryPreferences: true,
      transportRequirements: true,
    },
  });

  if (!profile) return null;

  const mobility = profile.mobilityNeeds as unknown;
  const sensory = profile.sensoryPreferences as Record<string, unknown>;
  const transport = profile.transportRequirements as Record<string, unknown>;
  const comms = profile.communicationPreferences as unknown;

  return {
    communicationPreferences: Array.isArray(comms)
      ? comms.map(String)
      : undefined,
    mobilityNotes:
      typeof mobility === "object" && mobility !== null
        ? JSON.stringify(mobility).slice(0, 500)
        : undefined,
    sensoryNotes:
      Object.keys(sensory).length > 0
        ? JSON.stringify(sensory).slice(0, 500)
        : undefined,
    supportAnimal: transport.assistanceAnimal === true,
  };
}

export function formatAccessibilitySnapshotForSummary(
  snapshot: AccessibilitySnapshot | null,
): string | undefined {
  if (!snapshot) return undefined;
  const parts: string[] = [];
  if (snapshot.communicationPreferences?.length) {
    parts.push(
      `Communication: ${snapshot.communicationPreferences.join(", ")}`,
    );
  }
  if (snapshot.mobilityNotes) parts.push(`Mobility: ${snapshot.mobilityNotes}`);
  if (snapshot.sensoryNotes) parts.push(`Sensory: ${snapshot.sensoryNotes}`);
  if (snapshot.supportAnimal) parts.push("Assistance animal: yes");
  return parts.length ? parts.join(". ") : undefined;
}
