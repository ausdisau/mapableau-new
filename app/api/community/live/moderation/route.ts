import { getApiUser } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { canModerateFinding, mayApprovePublicFinding } from "@/lib/community-live/policy";
import { communityDisabled, communityInputError, communityLiveEnabled, communityNoStore, communityOriginGuard, communityPilotAccessGuard, communityPilotModeEnabled } from "@/lib/community-live/runtime";
import { moderateFindingSchema, parseCommunityJson } from "@/lib/community-live/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await getApiUser();
  if (!user) return communityNoStore({ error: "Sign in required" }, 401);
  const pilotDenied = communityPilotAccessGuard(user);
  if (pilotDenied) return pilotDenied;
  if (!isAdminRole(user.primaryRole)) return communityNoStore({ error: "Moderation permission required" }, 403);
  const queue = await prisma.communitySignalObservation.findMany({
    where: {
      moderation: { in: ["pending", "needs_info"] },
      consentScope: { in: ["review", "public"] },
      consentWithdrawnAt: null,
    },
    select: {
      id: true, title: true, feature: true, finding: true, method: true,
      observedAt: true, evidenceState: true, consentScope: true,
      moderation: true, challengeId: true, createdAt: true,
      authorId: true, challenge: { select: { status: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  // Reviewers need only a self-review restriction, not author identity.
  return communityNoStore({
    queue: queue.map(({ authorId, ...item }) => ({ ...item, canReview: authorId !== user.id })),
  });
}

export async function POST(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await getApiUser();
  if (!user) return communityNoStore({ error: "Sign in required" }, 401);
  const pilotDenied = communityPilotAccessGuard(user);
  if (pilotDenied) return pilotDenied;
  if (!isAdminRole(user.primaryRole)) return communityNoStore({ error: "Moderation permission required" }, 403);
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  try {
    const parsed = moderateFindingSchema.safeParse(await parseCommunityJson(request));
    if (!parsed.success) return communityNoStore({ error: "Invalid review decision" }, 400);
    const { id, decision, note } = parsed.data;
    if (communityPilotModeEnabled() && decision === "approved") {
      return communityNoStore({
        error: "Public publication approval is disabled for the protected pilot",
      }, 409);
    }
    const result = await prisma.$transaction(async tx => {
      const existing = await tx.communitySignalObservation.findUnique({
        where: { id },
        select: {
          id: true, authorId: true, consentScope: true,
          consentWithdrawnAt: true, moderation: true, challenge: { select: { status: true } },
        },
      });
      if (!existing) return { error: "NOT_FOUND" } as const;
      if (existing.authorId === user.id) return { error: "SELF_REVIEW" } as const;
      if (!canModerateFinding(existing.consentScope, existing.consentWithdrawnAt)) {
        return { error: "CONSENT_RESTRICTED" } as const;
      }
      if (existing.challenge.status !== "published") return { error: "CHALLENGE_NOT_PUBLIC" } as const;
      if (decision === "approved" && !mayApprovePublicFinding(existing.consentScope, existing.authorId, user.id)) {
        return { error: "PUBLIC_CONSENT_REQUIRED" } as const;
      }
      // Atomic optimistic guard prevents a concurrent withdrawal or second review from being overridden.
      const change = await tx.communitySignalObservation.updateMany({
        where: {
          id, moderation: { in: ["pending", "needs_info"] }, consentScope: existing.consentScope,
          consentWithdrawnAt: null,
        },
        data: {
          moderation: decision,
          reviewNote: note,
          reviewerId: user.id,
          reviewedAt: new Date(),
          publicAt: decision === "approved" ? new Date() : null,
          // Publication review is NOT independent feature verification.
          evidenceState: decision === "approved" ? "reviewed" : "reported", rating: "unknown",
        },
      });
      if (change.count !== 1) return { error: "CONFLICT" } as const;
      await tx.communitySignalAudit.create({
        data: { action: "observation_moderated", entityType: "observation", entityId: id, actorId: user.id },
      });
      return { id, moderation: decision } as const;
    });
    if ("error" in result) {
      const status = result.error === "NOT_FOUND" ? 404 : result.error === "SELF_REVIEW" ? 403 : 409;
      return communityNoStore({ error: result.error }, status);
    }
    return communityNoStore({ observation: result });
  } catch (error) {
    if (error instanceof Error && ["CONTENT_TYPE", "BODY_TOO_LARGE", "INVALID_JSON"].includes(error.message)) {
      return communityInputError(error);
    }
    throw error;
  }
}
