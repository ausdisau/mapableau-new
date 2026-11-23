import { requireApiSession } from "@/lib/api/auth-handler";
import { communityDisabled, communityLiveEnabled, communityNoStore, communityOriginGuard } from "@/lib/community-live/runtime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Withdrawal is a privacy request, not a moderation vote. Deny public access immediately. */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!communityLiveEnabled()) return communityDisabled();
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await context.params;
  if (!id || id.length > 80) return communityNoStore({ error: "Invalid identifier" }, 400);
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.communitySignalObservation.updateMany({
      where: { id, authorId: user.id, consentWithdrawnAt: null },
      data: {
        consentWithdrawnAt: new Date(), consentScope: "private", moderation: "withdrawn",
        publicAt: null, reviewerId: null, reviewedAt: null, reviewNote: null,
        finding: "[withdrawn]", title: "[withdrawn]", feature: "[withdrawn]",
      },
    });
    if (updated.count) {
      await tx.communitySignalAudit.create({
        data: { action: "observation.withdrawn", entityType: "observation", entityId: id, actorId: user.id },
      });
    }
    return updated.count;
  });
  if (!result) return communityNoStore({ error: "Not found" }, 404);
  return communityNoStore({
    status: "withdrawn",
    message: "The observation is no longer public or reviewable. Request deletion of remaining minimal records through MapAble privacy support.",
  });
}
