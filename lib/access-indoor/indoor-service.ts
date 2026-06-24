import type { Prisma } from "@prisma/client";

import {
  isIndoorPositioningEnabled,
  resolveBuildingPositioning,
} from "@/lib/config/indoor-mapping";
import { prisma } from "@/lib/prisma";

import type { IndoorBuildingView, IndoorPlaceView } from "./types";

const publishedBuildingInclude = {
  floors: {
    where: { status: "published" as const },
    orderBy: [{ sortOrder: "asc" as const }, { levelIndex: "asc" as const }],
    include: {
      pois: { orderBy: { name: "asc" as const } },
    },
  },
} satisfies Prisma.AccessVenueBuildingInclude;

function mapBuilding(
  building: Prisma.AccessVenueBuildingGetPayload<{
    include: typeof publishedBuildingInclude;
  }>
): IndoorBuildingView {
  const positioning = resolveBuildingPositioning(building);

  return {
    id: building.id,
    name: building.name,
    positioningVendor: positioning.vendor,
    positioningEmbedUrl: building.positioningEmbedUrl,
    externalVendorId: building.externalVendorId,
    positioningEnabled: isIndoorPositioningEnabled(positioning),
    floors: building.floors.map((floor) => ({
      id: floor.id,
      levelIndex: floor.levelIndex,
      label: floor.label,
      sortOrder: floor.sortOrder,
      floorPlanImageUrl: floor.floorPlanImageUrl,
      imageBounds: floor.imageBounds,
      vectorGeoJson: floor.vectorGeoJson,
      widthMeters: floor.widthMeters,
      heightMeters: floor.heightMeters,
      pois: floor.pois.map((poi) => ({
        id: poi.id,
        type: poi.type,
        name: poi.name,
        xNorm: poi.xNorm,
        yNorm: poi.yNorm,
        accessibleRouteOnly: poi.accessibleRouteOnly,
        featureType: poi.featureType,
        notes: poi.notes,
      })),
    })),
  };
}

export async function getPublishedIndoorForPlace(
  placeId: string
): Promise<IndoorPlaceView | null> {
  const buildings = await prisma.accessVenueBuilding.findMany({
    where: { placeId, status: "published" },
    include: publishedBuildingInclude,
    orderBy: { name: "asc" },
  });

  if (buildings.length === 0) return null;

  return {
    placeId,
    buildings: buildings.map(mapBuilding),
  };
}

export async function getIndoorBuildingById(buildingId: string) {
  return prisma.accessVenueBuilding.findUnique({
    where: { id: buildingId },
    include: {
      place: { select: { id: true, name: true } },
      floors: {
        include: { pois: true, edges: true },
        orderBy: [{ sortOrder: "asc" }, { levelIndex: "asc" }],
      },
    },
  });
}

export async function upsertIndoorFloor(params: {
  buildingId: string;
  levelIndex: number;
  label: string;
  sortOrder?: number;
  status?: "draft" | "published";
  floorPlanImageUrl?: string | null;
  imageBounds?: Prisma.InputJsonValue;
  widthMeters?: number | null;
  heightMeters?: number | null;
}) {
  return prisma.accessVenueFloor.upsert({
    where: {
      buildingId_levelIndex: {
        buildingId: params.buildingId,
        levelIndex: params.levelIndex,
      },
    },
    create: {
      buildingId: params.buildingId,
      levelIndex: params.levelIndex,
      label: params.label,
      sortOrder: params.sortOrder ?? params.levelIndex,
      status: params.status ?? "draft",
      floorPlanImageUrl: params.floorPlanImageUrl,
      imageBounds: params.imageBounds,
      widthMeters: params.widthMeters,
      heightMeters: params.heightMeters,
    },
    update: {
      label: params.label,
      sortOrder: params.sortOrder,
      status: params.status,
      floorPlanImageUrl: params.floorPlanImageUrl,
      imageBounds: params.imageBounds,
      widthMeters: params.widthMeters,
      heightMeters: params.heightMeters,
    },
  });
}

export async function replaceFloorPois(params: {
  floorId: string;
  pois: Array<{
    type: Prisma.AccessIndoorPoiCreateWithoutFloorInput["type"];
    name: string;
    xNorm: number;
    yNorm: number;
    accessibleRouteOnly?: boolean;
    featureType?: Prisma.AccessIndoorPoiCreateWithoutFloorInput["featureType"];
    notes?: string | null;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.accessIndoorEdge.deleteMany({ where: { floorId: params.floorId } });
    await tx.accessIndoorPoi.deleteMany({ where: { floorId: params.floorId } });

    if (params.pois.length === 0) return [];

    await tx.accessIndoorPoi.createMany({
      data: params.pois.map((poi) => ({
        floorId: params.floorId,
        type: poi.type,
        name: poi.name,
        xNorm: poi.xNorm,
        yNorm: poi.yNorm,
        accessibleRouteOnly: poi.accessibleRouteOnly ?? false,
        featureType: poi.featureType,
        notes: poi.notes,
      })),
    });

    return tx.accessIndoorPoi.findMany({
      where: { floorId: params.floorId },
      orderBy: { name: "asc" },
    });
  });
}

export async function importIndoorPilot(params: {
  placeId: string;
  buildingName: string;
  floors: Array<{
    levelIndex: number;
    label: string;
    floorPlanImageUrl?: string;
    pois: Array<{
      type: Prisma.AccessIndoorPoiCreateWithoutFloorInput["type"];
      name: string;
      xNorm: number;
      yNorm: number;
      accessibleRouteOnly?: boolean;
    }>;
    edges?: Array<{
      fromName: string;
      toName: string;
      weight?: number;
      requiresStairs?: boolean;
      accessibleOnly?: boolean;
    }>;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.accessVenueBuilding.findFirst({
      where: { placeId: params.placeId },
      orderBy: { createdAt: "asc" },
    });

    const building = existing
      ? await tx.accessVenueBuilding.update({
          where: { id: existing.id },
          data: { name: params.buildingName, status: "published" },
        })
      : await tx.accessVenueBuilding.create({
          data: {
            placeId: params.placeId,
            name: params.buildingName,
            status: "published",
          },
        });

    for (const floorInput of params.floors) {
      const floor = await tx.accessVenueFloor.upsert({
        where: {
          buildingId_levelIndex: {
            buildingId: building.id,
            levelIndex: floorInput.levelIndex,
          },
        },
        create: {
          buildingId: building.id,
          levelIndex: floorInput.levelIndex,
          label: floorInput.label,
          sortOrder: floorInput.levelIndex,
          status: "published",
          floorPlanImageUrl: floorInput.floorPlanImageUrl,
        },
        update: {
          label: floorInput.label,
          status: "published",
          floorPlanImageUrl: floorInput.floorPlanImageUrl,
        },
      });

      await tx.accessIndoorEdge.deleteMany({ where: { floorId: floor.id } });
      await tx.accessIndoorPoi.deleteMany({ where: { floorId: floor.id } });

      const poiRecords = await Promise.all(
        floorInput.pois.map((poi) =>
          tx.accessIndoorPoi.create({
            data: {
              floorId: floor.id,
              type: poi.type,
              name: poi.name,
              xNorm: poi.xNorm,
              yNorm: poi.yNorm,
              accessibleRouteOnly: poi.accessibleRouteOnly ?? false,
            },
          })
        )
      );

      const poiByName = new Map(poiRecords.map((p) => [p.name, p.id]));

      for (const edge of floorInput.edges ?? []) {
        const fromPoiId = poiByName.get(edge.fromName);
        const toPoiId = poiByName.get(edge.toName);
        if (!fromPoiId || !toPoiId) continue;

        await tx.accessIndoorEdge.create({
          data: {
            floorId: floor.id,
            fromPoiId,
            toPoiId,
            weight: edge.weight ?? 1,
            requiresStairs: edge.requiresStairs ?? false,
            accessibleOnly: edge.accessibleOnly ?? false,
          },
        });
      }
    }

    return building;
  });
}
