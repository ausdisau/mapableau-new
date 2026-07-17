import { prisma } from "@/lib/prisma";

/**
 * The access passport is a *summary view*: it composes what a participant
 * has explicitly chosen to expose from their vault, using functional-need
 * language rather than diagnostic language.
 *
 * NOT INCLUDED IN A PASSPORT:
 *  - Diagnostic categories
 *  - NDIS plan financials
 *  - Government identifiers
 *  - Medical instructions (those live in emergency-only channels)
 */

export interface AccessPassportProfile {
  participantId: string;
  displayName: string;
  functionalNeeds: string[];
  communicationPreferences: string[];
  environmentalNeeds: string[];
  supportProviderCount: number;
  disclaimer: string;
}

export async function buildAccessPassportProfile(
  participantId: string
): Promise<AccessPassportProfile> {
  const user = await prisma.user.findUnique({
    where: { id: participantId },
    select: { id: true, name: true },
  });
  const claims = await prisma.portableClaim.findMany({
    where: {
      subjectId: participantId,
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gt: new Date() } },
      ],
      category: {
        in: [
          "accessibility_preference",
          "communication_preference",
          "environmental_need",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const providerCount = await prisma.participantProviderRelationship.count({
    where: { participantId },
  });
  return {
    participantId,
    displayName: user?.name ?? "Participant",
    functionalNeeds: claims
      .filter((c) => c.category === "accessibility_preference")
      .map((c) => c.statement),
    communicationPreferences: claims
      .filter((c) => c.category === "communication_preference")
      .map((c) => c.statement),
    environmentalNeeds: claims
      .filter((c) => c.category === "environmental_need")
      .map((c) => c.statement),
    supportProviderCount: providerCount,
    disclaimer:
      "This access passport describes functional preferences only. It is not a clinical record and is not a government credential.",
  };
}
