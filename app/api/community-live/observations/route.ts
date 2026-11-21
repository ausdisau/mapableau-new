import { requireApiSession } from "@/lib/api/auth-handler";
import { COMMUNITY_CONSENT_VERSION, canPublishFinding, publicFinding } from "@/lib/community-live/policy";
import { communityDisabled, communityInputError, communityLiveEnabled, communityNoStore, communityOriginGuard } from "@/lib/community-live/runtime";
import { createFindingSchema, parseCommunityJson } from "@/lib/community-live/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const url = new URL(request.url);
  if (url.searchParams.get("scope") === "mine") {
    const user = await requireApiSession();
    if (user instanceof Response) return user;
    const observations = await prisma.communitySignalObservation.findMany({
      where: { authorId: user.id, consentWithdrawnAt: null },
      select: {
        id: true, challengeId: true, title: true, feature: true, finding: true,
        method: true, observedAt: true, consentScope: true, moderation: true,
        evidenceState: true, rating: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return communityNoStore({ observations });
  }
  const records = await prisma.communitySignalObservation.findMany({
    where: {
      consentScope: "public", moderation: "approved", consentWithdrawnAt: null,
      challenge: { status: "published" },
    },
    select: {
      id: true, challengeId: true, title: true, feature: true, finding: true,
      method: true, observedAt: true, evidenceState: true, rating: true, createdAt: true,
      consentScope: true, moderation: true, consentWithdrawnAt: true,
      challenge: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return communityNoStore({
    observations: records.filter((o) => canPublishFinding({
      consentScope: o.consentScope, moderation: o.moderation,
      consentWithdrawnAt: o.consentWithdrawnAt, challengeStatus: o.challenge.status,
    })).map(publicFinding),
  });
}

export async function POST(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  let data;
  try {
    data = createFindingSchema.parse(await parseCommunityJson(request));
  } catch (error) {
    return communityInputError(error);
  }
  const challenge = await prisma.communitySignalChallenge.findUnique({
    where: { id: data.challengeId }, select: { status: true },
  });
  if (!challenge || challenge.status !== "published") {
    return communityNoStore({ error: "Challenge unavailable" }, 404);
  }
  const observation = await prisma.$transaction(async (tx) => {
    const created = await tx.communitySignalObservation.create({
      data: {
        challengeId: data.challengeId, authorId: user.id,
        title: data.title, feature: data.feature, finding: data.finding,
        method: data.method, observedAt: new Date(data.observedAt + "T00:00:00.000Z"),
        consentScope: data.consentScope, consentVersion: COMMUNITY_CONSENT_VERSION,
        moderation: "pending", evidenceState: "reported", rating: "unknown",
      },
      select: { id: true, consentScope: true, moderation: true, rating: true },
    });
    await tx.communitySignalAudit.create({
      data: { action: "observation.created", entityType: "observation", entityId: created.id, actorId: user.id },
    });
    return created;
  });
  return communityNoStore({ observation, message: "Saved. Not published or independently verified." }, 201);
}
