import { requireApiAdmin } from "@/lib/api/auth-handler";
import { canModerateFinding, mayApprovePublicFinding } from "@/lib/community-live/policy";
import { communityDisabled, communityInputError, communityLiveEnabled, communityNoStore, communityOriginGuard } from "@/lib/community-live/runtime";
import { moderateFindingSchema, parseCommunityJson } from "@/lib/community-live/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const observations = await prisma.communitySignalObservation.findMany({
    where: { consentScope: { in: ["review", "public"] }, consentWithdrawnAt: null,
      moderation: { in: ["pending", "needs_info"] } },
    select: { id: true, challengeId: true, title: true, feature: true, finding: true,
      method: true, observedAt: true, consentScope: true, moderation: true, authorId: true },
    orderBy: { createdAt: "asc" }, take: 50,
  });
  return communityNoStore({ observations });
}

export async function POST(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  let data;
  try {
    data = moderateFindingSchema.parse(await parseCommunityJson(request));
  } catch (error) {
    return communityInputError(error);
  }
  const row = await prisma.communitySignalObservation.findUnique({
    where: { id: data.id },
    select: { id: true, authorId: true, consentScope: true,
      consentWithdrawnAt: true, moderation: true, challenge: { select: { status: true } } },
  });
  if (!row || !canModerateFinding(row.consentScope, row.consentWithdrawnAt)) {
    return communityNoStore({ error: "Not found or unavailable for review" }, 404);
  }
  if (data.decision === "approved" &&
    (!mayApprovePublicFinding(row.consentScope, row.authorId, user.id) || row.challenge.status !== "published")) {
    return communityNoStore({ error: "Public consent, an open challenge and an independent reviewer are required" }, 409);
  }
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.communitySignalObservation.updateMany({
      where: {
        id: data.id,
        consentScope: data.decision === "approved" ? "public" : { in: ["review", "public"] },
        consentWithdrawnAt: null,
        moderation: { in: ["pending", "needs_info"] },
      },
      data: {
        moderation: data.decision,
        evidenceState: data.decision === "approved" ? "reviewed" : "reported",
        rating: "unknown", reviewerId: user.id, reviewedAt: new Date(),
        reviewNote: data.note, publicAt: data.decision === "approved" ? new Date() : null,
      },
    });
    if (updated.count) {
      await tx.communitySignalAudit.create({
        data: { action: "observation.moderated", entityType: "observation", entityId: data.id, actorId: user.id },
      });
    }
    return updated.count;
  });
  if (!result) return communityNoStore({ error: "Record changed; review again" }, 409);
  return communityNoStore({ status: data.decision, rating: "unknown",
    message: "Human moderation recorded. Review is not an independent accessibility assessment." });
}
