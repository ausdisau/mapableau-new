import {
  replaceFloorPois,
  upsertIndoorFloor,
} from "@/lib/access-indoor/indoor-service";
import { canManageIndoorForPlace } from "@/lib/access-indoor/indoor-access-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { upsertIndoorFloorSchema } from "@/types/access-indoor";
import type { Prisma } from "@prisma/client";

async function resolveBuildingId(placeId: string, buildingId?: string) {
  if (buildingId) {
    const building = await prisma.accessVenueBuilding.findFirst({
      where: { id: buildingId, placeId },
    });
    return building?.id ?? null;
  }

  const building = await prisma.accessVenueBuilding.findFirst({
    where: { placeId },
    orderBy: { createdAt: "asc" },
  });

  if (building) return building.id;

  const created = await prisma.accessVenueBuilding.create({
    data: {
      placeId,
      name: "Main building",
      status: "draft",
    },
  });
  return created.id;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  const allowed = await canManageIndoorForPlace(user, placeId);
  if (!allowed) return jsonError("Forbidden", 403);

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = upsertIndoorFloorSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const buildingId = await resolveBuildingId(placeId, parsed.data.buildingId);
  if (!buildingId) return jsonError("Building not found", 404);

  if (parsed.data.buildingName) {
    await prisma.accessVenueBuilding.update({
      where: { id: buildingId },
      data: { name: parsed.data.buildingName },
    });
  }

  const floor = await upsertIndoorFloor({
    buildingId,
    levelIndex: parsed.data.levelIndex,
    label: parsed.data.label,
    sortOrder: parsed.data.sortOrder,
    status: parsed.data.status,
    floorPlanImageUrl: parsed.data.floorPlanImageUrl,
    imageBounds: parsed.data.imageBounds as Prisma.InputJsonValue | undefined,
    widthMeters: parsed.data.widthMeters,
    heightMeters: parsed.data.heightMeters,
  });

  const pois =
    parsed.data.pois != null
      ? await replaceFloorPois({
          floorId: floor.id,
          pois: parsed.data.pois,
        })
      : [];

  return jsonOk({ floor, pois }, 201);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  return POST(req, { params });
}
