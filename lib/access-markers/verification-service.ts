import type { AccessMarkerVerificationAction } from "@prisma/client";

import { recomputeMarkerAggregate } from "@/lib/access-markers/aggregate-service";
import { prisma } from "@/lib/prisma";

export async function createMarkerVerification(params: {
  placeId: string;
  userId: string;
  action: AccessMarkerVerificationAction;
  note?: string;
  commentId?: string;
  evidenceNote?: string;
}) {
  const place = await prisma.accessPlace.findUnique({
    where: { id: params.placeId },
    select: { id: true },
  });
  if (!place) throw new Error("PLACE_NOT_FOUND");

  if (params.action === "resolve_alert" && params.commentId) {
    await prisma.accessMarkerComment.updateMany({
      where: {
        id: params.commentId,
        placeId: params.placeId,
        commentType: "temporary_alert",
      },
      data: { status: "archived" },
    });
  }

  const verification = await prisma.accessMarkerVerification.create({
    data: {
      placeId: params.placeId,
      userId: params.userId,
      action: params.action,
      note: params.note,
      commentId: params.commentId,
      evidenceNote: params.evidenceNote,
    },
  });

  await prisma.accessTrustEvent.create({
    data: {
      entityType: "AccessPlace",
      entityId: params.placeId,
      eventType: `marker.verification.${params.action}`,
      metadata: {
        verificationId: verification.id,
        userId: params.userId,
        note: params.note ?? null,
      },
    },
  });

  const aggregate = await recomputeMarkerAggregate(params.placeId);
  return { verification, aggregate };
}
