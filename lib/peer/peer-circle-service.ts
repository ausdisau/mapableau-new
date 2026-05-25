import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { adminCreatePeerCircleSchema } from "@/lib/validation/peer";
import type { z } from "zod";

import { PeerAccessError } from "./access-control";

export async function listPeerCircles() {
  return prisma.peerCircle.findMany({
    where: { status: "active" },
    orderBy: { title: "asc" },
    include: {
      _count: { select: { members: true } },
    },
  });
}

export async function getPeerCircle(circleId: string) {
  return prisma.peerCircle.findUnique({
    where: { id: circleId },
    include: {
      members: {
        include: {
          peerProfile: { include: { user: { select: { name: true } } } },
        },
      },
      posts: {
        where: { status: "published", deletedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 50,
        include: {
          author: { include: { user: { select: { name: true } } } },
          _count: { select: { replies: true } },
        },
      },
    },
  });
}

export async function joinPeerCircle(peerProfileId: string, circleId: string) {
  const circle = await prisma.peerCircle.findUnique({ where: { id: circleId } });
  if (!circle || circle.status !== "active") {
    throw new PeerAccessError("Circle not available", "PEER_CIRCLE_NOT_FOUND");
  }
  if (circle.circleType === "invite_only") {
    throw new PeerAccessError("Invite only circle", "PEER_CIRCLE_INVITE_ONLY");
  }

  return prisma.peerCircleMember.upsert({
    where: {
      circleId_peerProfileId: { circleId, peerProfileId },
    },
    create: { circleId, peerProfileId },
    update: {},
  });
}

export async function leavePeerCircle(peerProfileId: string, circleId: string) {
  return prisma.peerCircleMember.delete({
    where: {
      circleId_peerProfileId: { circleId, peerProfileId },
    },
  });
}

export async function adminCreatePeerCircle(
  actorUserId: string,
  data: z.infer<typeof adminCreatePeerCircleSchema>
) {
  const circle = await prisma.peerCircle.create({ data });

  await createAuditEvent({
    actorUserId,
    action: "peer.circle.created",
    entityType: "PeerCircle",
    entityId: circle.id,
  });

  return circle;
}
