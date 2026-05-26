import { Prisma, type AccessVenueClaim } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { isPrismaErrorCode } from "@/lib/prisma-errors";

export const VENUE_CLAIM_RATE_LIMIT_PER_HOUR = 5;

export async function submitVenueClaim(params: {
  placeId: string;
  userId: string;
  businessName?: string;
  evidenceNote?: string;
}) {
  let claim: AccessVenueClaim;
  try {
    claim = await prisma.$transaction(
      async (tx) => {
        const recentCount = await tx.accessVenueClaim.count({
          where: {
            userId: params.userId,
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        });

        const existingActiveClaim = await tx.accessVenueClaim.findFirst({
          where: {
            placeId: params.placeId,
            userId: params.userId,
            status: { in: ["submitted", "needs_evidence"] },
          },
          select: { id: true },
        });

        if (recentCount >= VENUE_CLAIM_RATE_LIMIT_PER_HOUR) {
          throw new Error("VENUE_CLAIM_RATE_LIMIT");
        }

        if (existingActiveClaim) {
          throw new Error("VENUE_CLAIM_ALREADY_SUBMITTED");
        }

        return tx.accessVenueClaim.create({
          data: {
            placeId: params.placeId,
            userId: params.userId,
            businessName: params.businessName,
            evidenceNote: params.evidenceNote,
            status: "submitted",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (isPrismaErrorCode(error, "P2034")) {
      throw new Error("VENUE_CLAIM_RATE_LIMIT");
    }
    throw error;
  }

  await createAuditEvent({
    actorUserId: params.userId,
    action: "access_venue_claim.submitted",
    entityType: "AccessVenueClaim",
    entityId: claim.id,
  });

  return claim;
}

export async function approveVenueClaim(claimId: string, adminId: string) {
  const claim = await prisma.accessVenueClaim.update({
    where: { id: claimId },
    data: { status: "approved" },
  });

  await prisma.accessVenueProfile.upsert({
    where: { placeId: claim.placeId },
    create: {
      placeId: claim.placeId,
      ownerUserId: claim.userId,
    },
    update: { ownerUserId: claim.userId },
  });

  await prisma.accessPlace.update({
    where: { id: claim.placeId },
    data: { sourceType: "venue_claimed", confidence: "venue_claimed" },
  });

  await createAuditEvent({
    actorUserId: adminId,
    action: "access_venue_claim.approved",
    entityType: "AccessVenueClaim",
    entityId: claimId,
  });

  return claim;
}
