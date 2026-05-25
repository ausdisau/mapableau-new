import type {
  AccessFloorPlanMarkerConfidence,
  AccessFloorPlanMarkerType,
  AccessFloorPlanSourceType,
  AccessFloorPlanStatus,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type {
  CreateFloorPlanMarkerInput,
  FloorPlanMetadataInput,
} from "@/lib/validation/access-floor-plan";

const floorPlanInclude = {
  markers: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
};

export type FloorPlanWithMarkers = Awaited<
  ReturnType<typeof getFloorPlanForAuthoring>
>;

export function isInteractiveFloorPlanMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function floorPlanAssetUrl(floorPlan: {
  id: string;
  placeId: string;
  publicUrl: string | null;
}) {
  return (
    floorPlan.publicUrl ??
    `/api/access/places/${floorPlan.placeId}/floor-plans/${floorPlan.id}/asset`
  );
}

export function serializePublicFloorPlan<
  T extends {
    id: string;
    placeId: string;
    title: string;
    levelLabel: string | null;
    mimeType: string;
    width: number | null;
    height: number | null;
    altText: string;
    publicNotes: string | null;
    publicUrl: string | null;
    markers: {
      id: string;
      type: string;
      title: string;
      description: string | null;
      xPercent: number;
      yPercent: number;
      confidence: string;
      severity: string | null;
      sortOrder: number;
    }[];
  },
>(floorPlan: T) {
  return {
    id: floorPlan.id,
    placeId: floorPlan.placeId,
    title: floorPlan.title,
    levelLabel: floorPlan.levelLabel,
    mimeType: floorPlan.mimeType,
    width: floorPlan.width,
    height: floorPlan.height,
    altText: floorPlan.altText,
    publicNotes: floorPlan.publicNotes,
    assetUrl: floorPlanAssetUrl(floorPlan),
    markers: floorPlan.markers.map((marker) => ({
      id: marker.id,
      type: marker.type,
      title: marker.title,
      description: marker.description,
      xPercent: marker.xPercent,
      yPercent: marker.yPercent,
      confidence: marker.confidence,
      severity: marker.severity,
      sortOrder: marker.sortOrder,
    })),
  };
}

export async function listPublishedFloorPlansForPlace(placeId: string) {
  return prisma.accessFloorPlan.findMany({
    where: { placeId, status: "published", place: { status: "published" } },
    orderBy: [{ levelLabel: "asc" }, { createdAt: "asc" }],
    include: floorPlanInclude,
  });
}

export async function getPublishedFloorPlan(params: {
  placeId: string;
  floorPlanId: string;
}) {
  return prisma.accessFloorPlan.findFirst({
    where: {
      id: params.floorPlanId,
      placeId: params.placeId,
      status: "published",
      place: { status: "published" },
    },
    include: floorPlanInclude,
  });
}

export async function listFloorPlansForAuthoring(placeId: string) {
  return prisma.accessFloorPlan.findMany({
    where: { placeId, status: { not: "archived" } },
    orderBy: [{ updatedAt: "desc" }],
    include: floorPlanInclude,
  });
}

export async function getFloorPlanForAuthoring(params: {
  placeId: string;
  floorPlanId: string;
}) {
  return prisma.accessFloorPlan.findFirst({
    where: {
      id: params.floorPlanId,
      placeId: params.placeId,
      status: { not: "archived" },
    },
    include: floorPlanInclude,
  });
}

export async function getFloorPlanForAuthoringById(floorPlanId: string) {
  return prisma.accessFloorPlan.findFirst({
    where: {
      id: floorPlanId,
      status: { not: "archived" },
    },
    include: {
      ...floorPlanInclude,
      place: {
        select: {
          id: true,
          name: true,
          addressText: true,
          suburb: true,
          stateOrRegion: true,
        },
      },
    },
  });
}

export async function getFloorPlanAsset(params: {
  placeId: string;
  floorPlanId: string;
}) {
  return prisma.accessFloorPlan.findFirst({
    where: {
      id: params.floorPlanId,
      placeId: params.placeId,
      status: { not: "archived" },
    },
    select: {
      id: true,
      placeId: true,
      storagePath: true,
      publicUrl: true,
      mimeType: true,
      title: true,
      status: true,
      place: { select: { status: true } },
    },
  });
}

export async function createFloorPlan(params: {
  placeId: string;
  uploadedById: string;
  sourceType: AccessFloorPlanSourceType;
  metadata: FloorPlanMetadataInput;
  storagePath: string;
  publicUrl?: string | null;
  mimeType: string;
}) {
  const floorPlan = await prisma.accessFloorPlan.create({
    data: {
      placeId: params.placeId,
      title: params.metadata.title,
      levelLabel: params.metadata.levelLabel,
      altText: params.metadata.altText,
      publicNotes: params.metadata.publicNotes,
      width: params.metadata.width,
      height: params.metadata.height,
      storagePath: params.storagePath,
      publicUrl: params.publicUrl,
      mimeType: params.mimeType,
      sourceType: params.sourceType,
      uploadedById: params.uploadedById,
      events: {
        create: {
          actorId: params.uploadedById,
          action: "floor_plan.created",
          metadata: { sourceType: params.sourceType },
        },
      },
    },
    include: floorPlanInclude,
  });

  await createAuditEvent({
    actorUserId: params.uploadedById,
    action: "access_floor_plan.created",
    entityType: "AccessFloorPlan",
    entityId: floorPlan.id,
  });

  return floorPlan;
}

export async function updateFloorPlan(params: {
  placeId: string;
  floorPlanId: string;
  actorId: string;
  data: {
    title?: string;
    levelLabel?: string;
    altText?: string;
    publicNotes?: string;
    width?: number;
    height?: number;
    status?: AccessFloorPlanStatus;
  };
}) {
  await assertFloorPlanBelongsToPlace(params.placeId, params.floorPlanId);
  const floorPlan = await prisma.accessFloorPlan.update({
    where: { id: params.floorPlanId },
    data: {
      ...params.data,
      ...(params.data.status
        ? {
            publishedAt: params.data.status === "published" ? new Date() : null,
          }
        : {}),
      events: {
        create: {
          actorId: params.actorId,
          action: "floor_plan.updated",
          metadata: { fields: Object.keys(params.data) },
        },
      },
    },
    include: floorPlanInclude,
  });

  await createAuditEvent({
    actorUserId: params.actorId,
    action: "access_floor_plan.updated",
    entityType: "AccessFloorPlan",
    entityId: floorPlan.id,
  });

  return floorPlan;
}

export async function createFloorPlanMarker(params: {
  placeId: string;
  floorPlanId: string;
  actorId: string;
  input: CreateFloorPlanMarkerInput;
}) {
  await assertFloorPlanBelongsToPlace(params.placeId, params.floorPlanId);
  return prisma.$transaction(async (tx) => {
    const marker = await tx.accessFloorPlanMarker.create({
      data: {
        floorPlanId: params.floorPlanId,
        type: params.input.type as AccessFloorPlanMarkerType,
        title: params.input.title,
        description: params.input.description,
        xPercent: params.input.xPercent,
        yPercent: params.input.yPercent,
        confidence: params.input.confidence as AccessFloorPlanMarkerConfidence,
        severity: params.input.severity,
        sortOrder: params.input.sortOrder,
      },
    });

    await tx.accessFloorPlanEvent.create({
      data: {
        floorPlanId: params.floorPlanId,
        actorId: params.actorId,
        action: "floor_plan_marker.created",
        metadata: { markerId: marker.id },
      },
    });

    return marker;
  });
}

export async function updateFloorPlanMarker(params: {
  placeId: string;
  floorPlanId: string;
  markerId: string;
  actorId: string;
  input: Partial<CreateFloorPlanMarkerInput>;
}) {
  await assertFloorPlanBelongsToPlace(params.placeId, params.floorPlanId);
  await assertMarkerBelongsToFloorPlan(params.floorPlanId, params.markerId);
  return prisma.$transaction(async (tx) => {
    const marker = await tx.accessFloorPlanMarker.update({
      where: { id: params.markerId },
      data: {
        type: params.input.type as AccessFloorPlanMarkerType | undefined,
        title: params.input.title,
        description: params.input.description,
        xPercent: params.input.xPercent,
        yPercent: params.input.yPercent,
        confidence: params.input.confidence as
          | AccessFloorPlanMarkerConfidence
          | undefined,
        severity: params.input.severity,
        sortOrder: params.input.sortOrder,
      },
    });

    await tx.accessFloorPlanEvent.create({
      data: {
        floorPlanId: params.floorPlanId,
        actorId: params.actorId,
        action: "floor_plan_marker.updated",
        metadata: {
          markerId: params.markerId,
          fields: Object.keys(params.input),
        },
      },
    });

    return marker;
  });
}

export async function deleteFloorPlanMarker(params: {
  placeId: string;
  floorPlanId: string;
  markerId: string;
  actorId: string;
}) {
  await assertFloorPlanBelongsToPlace(params.placeId, params.floorPlanId);
  await assertMarkerBelongsToFloorPlan(params.floorPlanId, params.markerId);
  return prisma.$transaction(async (tx) => {
    const marker = await tx.accessFloorPlanMarker.delete({
      where: { id: params.markerId },
    });

    await tx.accessFloorPlanEvent.create({
      data: {
        floorPlanId: params.floorPlanId,
        actorId: params.actorId,
        action: "floor_plan_marker.deleted",
        metadata: { markerId: params.markerId },
      },
    });

    return marker;
  });
}

async function assertFloorPlanBelongsToPlace(
  placeId: string,
  floorPlanId: string,
) {
  const floorPlan = await prisma.accessFloorPlan.findFirst({
    where: { id: floorPlanId, placeId, status: { not: "archived" } },
    select: { id: true },
  });
  if (!floorPlan) throw new Error("FLOOR_PLAN_NOT_FOUND");
}

async function assertMarkerBelongsToFloorPlan(
  floorPlanId: string,
  markerId: string,
) {
  const marker = await prisma.accessFloorPlanMarker.findFirst({
    where: { id: markerId, floorPlanId },
    select: { id: true },
  });
  if (!marker) throw new Error("FLOOR_PLAN_MARKER_NOT_FOUND");
}

export { floorPlanInclude };
