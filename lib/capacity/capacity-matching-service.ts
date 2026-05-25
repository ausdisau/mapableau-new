import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";
import { canNotifyProviders } from "./capacity-policy";

export async function runCapacityMatch(waitlistId: string) {
  await requireModuleEnabled("waitlist_exchange_enabled");

  const waitlist = await prisma.waitlistRequest.findUnique({
    where: { id: waitlistId },
  });
  if (!waitlist) throw new Error("WAITLIST_NOT_FOUND");

  const capacities = await prisma.providerCapacityBlock.findMany({
    where: {
      acceptingNewParticipants: true,
      serviceType: waitlist.requestedServiceType,
    },
    take: 20,
  });

  const suggestions = [];
  for (const cap of capacities) {
    const suggestion = await prisma.capacityMatchSuggestion.create({
      data: {
        waitlistId,
        organisationId: cap.organisationId,
        capacityId: cap.id,
        status: "suggested",
        matchScore: 0.8,
      },
    });
    suggestions.push(suggestion);
  }

  if (suggestions.length) {
    await prisma.waitlistRequest.update({
      where: { id: waitlistId },
      data: { status: "matched" },
    });
  }

  return { suggestions, canNotify: canNotifyProviders(waitlist.consentToNotifyProviders) };
}

export async function notifyCapacityMatch(matchId: string, actorUserId: string) {
  const match = await prisma.capacityMatchSuggestion.findUnique({
    where: { id: matchId },
    include: { waitlist: true },
  });
  if (!match) throw new Error("MATCH_NOT_FOUND");
  if (!canNotifyProviders(match.waitlist.consentToNotifyProviders)) {
    throw new Error("CONSENT_REQUIRED");
  }

  await prisma.capacityExchangeNotification.create({
    data: {
      matchId,
      recipientId: match.organisationId,
    },
  });

  await prisma.capacityMatchSuggestion.update({
    where: { id: matchId },
    data: { status: "notified" },
  });

  return match;
}
