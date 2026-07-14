
import { apiSuccessResponse } from "@/lib/platform/api/errors";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;

  const items: Array<Record<string, unknown>> = [];

  if (auth.participantId) {
    const missions = await prisma.careOSMission.findMany({
      where: { participantId: auth.participantId },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        desiredOutcome: true,
        status: true,
        updatedAt: true,
      },
    });

    for (const mission of missions) {
      items.push({
        id: mission.id,
        kind: "mission",
        title: mission.desiredOutcome || "CareOS mission",
        whatChanged: "Mission updated in CareOS.",
        whyItMatters: "A Care or Transport step may need your review.",
        needsDecision: true,
        whoIsWaiting: "You",
        whatHappensNext: "Open CareOS to review evidence and confirm actions separately.",
        href: `/(participant)/careos/${mission.id}`,
      });
    }
  }

  if (!items.length) {
    items.push({
      id: "human-help",
      kind: "human_help",
      title: "Human support",
      whatChanged: "No urgent items right now.",
      whyItMatters: "You can still ask a person for help.",
      needsDecision: false,
      whoIsWaiting: null,
      whatHappensNext: "Open Human help if you need support.",
      href: "/(participant)/help",
    });
  }

  return apiSuccessResponse({
    generatedAt: new Date().toISOString(),
    items,
  });
}
