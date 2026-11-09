import { getApiUser } from "@/lib/auth/guards";
import { publicFinding, COMMUNITY_CONSENT_VERSION, canPublishFinding } from "@/lib/community-live/policy";
import { communityDisabled, communityInputError, communityLiveEnabled, communityNoStore, communityOriginGuard } from "@/lib/community-live/runtime";
import { createFindingSchema, parseCommunityJson } from "@/lib/community-live/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "1";
  const user = mine ? await getApiUser() : null;
  if (mine && !user) return communityNoStore({ error: "Sign in required" }, 401);
  if (mine && user) {
    const records = await prisma.communitySignalObservation.findMany({
      where: { authorId: user.id },
      select: {
        id: true, challengeId: true, title: true, feature: true, finding: true,
        method: true, observedAt: true, consentScope: true, moderation: true,
        evidenceState: true, rating: true, createdAt: true, consentWithdrawnAt: true,
        reviewNote: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return communityNoStore({ observations: records, privacy: "Only your authenticated account" });
  }
  // Always filter in the database; do not accidentally return rejected or withdrawn rows.
  const approved = await prisma.communitySignalObservation.findMany({
    where: {
      consentScope: "public", moderation: "approved", consentWithdrawnAt: null,
      challenge: { status: "published" },
    },
    select: {
      id: true, challengeId: true, title: true, feature: true, finding: true,
      method: true, observedAt: true, evidenceState: true, rating: true,
      createdAt: true, consentScope: true, moderation: true,
      consentWithdrawnAt: true,
      challenge: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const observations = approved
    .filter(record => canPublishFinding({ ...record, challengeStatus: record.challenge.status }))
    .map(publicFinding);
  return communityNoStore({ observations, qualification: "Human reviewed community reports; not independently verified access" });
}

export async function POST(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await getApiUser();
  if (!user) return communityNoStore({ error: "Sign in required" }, 401);
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  try {
    const parsed = createFindingSchema.safeParse(await parseCommunityJson(request));
    if (!parsed.success) return communityNoStore({ error: "Check the observation fields and consent choice" }, 400);
    const input = parsed.data;
    const challenge = await prisma.communitySignalChallenge.findFirst({
      where: { id: input.challengeId, status: "published" },
      select: { id: true },
    });
    if (!challenge) return communityNoStore({ error: "Published challenge not found" }, 404);
    const count = await prisma.communitySignalObservation.count({
      where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 86400000) } },
    });
    if (count >= 12) return communityNoStore({ error: "Daily submission limit reached; contact support if urgent" }, 429);
    const record = await prisma.$transaction(async tx => {
      const created = await tx.communitySignalObservation.create({
        data: {
          challengeId: challenge.id, authorId: user.id,
          title: input.title, feature: input.feature, finding: input.finding,
          method: input.method, observedAt: new Date(input.observedAt + "T00:00:00.000Z"),
          consentScope: input.consentScope, consentVersion: COMMUNITY_CONSENT_VERSION,
          // Never assign verification or accreditation based on submission.
          moderation: "pending", evidenceState: "reported", rating: "unknown",
        },
        select: { id: true, consentScope: true, moderation: true, rating: true },
      });
      await tx.communitySignalAudit.create({
        data: { action: "observation_submitted", entityType: "observation", entityId: created.id, actorId: user.id },
      });
      return created;
    });
    return communityNoStore({ observation: record, next: "Submitted privately; not published or verified" }, 201);
  } catch (error) {
    if (error instanceof Error && ["CONTENT_TYPE", "BODY_TOO_LARGE", "INVALID_JSON"].includes(error.message)) {
      return communityInputError(error);
    }
    throw error;
  }
}

/** Author-requested removal of submitted content. A minimal audit event remains. */
export async function DELETE(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await getApiUser();
  if (!user) return communityNoStore({ error: "Sign in required" }, 401);
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  try {
    const payload = await parseCommunityJson(request);
    const id = typeof payload === "object" && payload && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).id : null;
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) {
      return communityNoStore({ error: "Invalid observation identifier" }, 400);
    }
    const removed = await prisma.$transaction(async tx => {
      const deleted = await tx.communitySignalObservation.deleteMany({
        where: { id, authorId: user.id },
      });
      if (deleted.count !== 1) return false;
      await tx.communitySignalAudit.create({
        data: { action: "observation_removed", entityType: "observation", entityId: id, actorId: user.id },
      });
      return true;
    });
    if (!removed) return communityNoStore({ error: "Observation not found" }, 404);
    return communityNoStore({ removed: true, note: "Submission content removed; minimal administrative audit metadata is retained" });
  } catch (error) {
    if (error instanceof Error && ["CONTENT_TYPE", "BODY_TOO_LARGE", "INVALID_JSON"].includes(error.message)) {
      return communityInputError(error);
    }
    throw error;
  }
}
