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
    footprintGeoJson: building.footprintGeoJson,
    baseElevationMeters: building.baseElevationMeters,
    totalHeightMeters: building.totalHeightMeters,
    defaultFloorHeightMeters: building.defaultFloorHeightMeters,
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
      floorHeightMeters: floor.floorHeightMeters,
      elevationMeters: floor.elevationMeters,
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
      verticalEdges: true,
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
  vectorGeoJson?: Prisma.InputJsonValue;
  widthMeters?: number | null;
  heightMeters?: number | null;
  floorHeightMeters?: number | null;
  elevationMeters?: number | null;
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
      vectorGeoJson: params.vectorGeoJson,
      widthMeters: params.widthMeters,
      heightMeters: params.heightMeters,
      floorHeightMeters: params.floorHeightMeters,
      elevationMeters: params.elevationMeters,
    },
    update: {
      label: params.label,
      sortOrder: params.sortOrder,
      status: params.status,
      floorPlanImageUrl: params.floorPlanImageUrl,
      imageBounds: params.imageBounds,
      vectorGeoJson: params.vectorGeoJson,
      widthMeters: params.widthMeters,
      heightMeters: params.heightMeters,
      floorHeightMeters: params.floorHeightMeters,
      elevationMeters: params.elevationMeters,
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
  footprintGeoJson?: Prisma.InputJsonValue;
  totalHeightMeters?: number;
  defaultFloorHeightMeters?: number;
  floors: Array<{
    levelIndex: number;
    label: string;
    floorPlanImageUrl?: string;
    imageBounds?: Prisma.InputJsonValue;
    floorHeightMeters?: number;
    elevationMeters?: number;
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
  verticalEdges?: Array<{
    fromFloorLevel: number;
    toFloorLevel: number;
    fromPoiName: string;
    toPoiName: string;
    weight?: number;
    requiresStairs?: boolean;
    accessibleOnly?: boolean;
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
          data: {
            name: params.buildingName,
            status: "published",
            footprintGeoJson: params.footprintGeoJson,
            totalHeightMeters: params.totalHeightMeters,
            defaultFloorHeightMeters: params.defaultFloorHeightMeters,
          },
        })
      : await tx.accessVenueBuilding.create({
          data: {
            placeId: params.placeId,
            name: params.buildingName,
            status: "published",
            footprintGeoJson: params.footprintGeoJson,
            totalHeightMeters: params.totalHeightMeters,
            defaultFloorHeightMeters: params.defaultFloorHeightMeters ?? 3.5,
          },
        });

    const floorByLevel = new Map<number, { id: string; poiByName: Map<string, string> }>();

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
          imageBounds: floorInput.imageBounds,
          floorHeightMeters: floorInput.floorHeightMeters,
          elevationMeters: floorInput.elevationMeters,
        },
        update: {
          label: floorInput.label,
          status: "published",
          floorPlanImageUrl: floorInput.floorPlanImageUrl,
          imageBounds: floorInput.imageBounds,
          floorHeightMeters: floorInput.floorHeightMeters,
          elevationMeters: floorInput.elevationMeters,
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
      floorByLevel.set(floorInput.levelIndex, { id: floor.id, poiByName });

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

    await tx.accessIndoorVerticalEdge.deleteMany({
      where: { buildingId: building.id },
    });

    for (const vertical of params.verticalEdges ?? []) {
      const fromFloor = floorByLevel.get(vertical.fromFloorLevel);
      const toFloor = floorByLevel.get(vertical.toFloorLevel);
      const fromPoiId = fromFloor?.poiByName.get(vertical.fromPoiName);
      const toPoiId = toFloor?.poiByName.get(vertical.toPoiName);
      if (!fromFloor || !toFloor || !fromPoiId || !toPoiId) continue;

      await tx.accessIndoorVerticalEdge.create({
        data: {
          buildingId: building.id,
          fromFloorId: fromFloor.id,
          toFloorId: toFloor.id,
          fromPoiId,
          toPoiId,
          weight: vertical.weight ?? 2,
          requiresStairs: vertical.requiresStairs ?? false,
          accessibleOnly: vertical.accessibleOnly ?? false,
        },
      });
    }

    return building;
  });
}

export function createRectFootprintGeoJson(params: {
  centerLat: number;
  centerLng: number;
  widthMeters: number;
  heightMeters: number;
}): GeoJSON.Polygon {
  const latOffset = params.heightMeters / 2 / 111_000;
  const lngOffset =
    params.widthMeters /
    2 /
    (111_000 * Math.cos((params.centerLat * Math.PI) / 180));

  return {
    type: "Polygon",
    coordinates: [
      [
        [params.centerLng - lngOffset, params.centerLat + latOffset],
        [params.centerLng + lngOffset, params.centerLat + latOffset],
        [params.centerLng + lngOffset, params.centerLat - latOffset],
        [params.centerLng - lngOffset, params.centerLat - latOffset],
        [params.centerLng - lngOffset, params.centerLat + latOffset],
      ],
    ],
  };
}
