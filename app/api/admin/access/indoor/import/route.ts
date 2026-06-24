import { importIndoorPilot } from "@/lib/access-indoor/indoor-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { adminIndoorImportSchema } from "@/types/access-indoor";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = adminIndoorImportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const place = await prisma.accessPlace.findUnique({
    where: { id: parsed.data.placeId },
    select: { id: true },
  });
  if (!place) return jsonError("Place not found", 404);

  const building = await importIndoorPilot({
    placeId: parsed.data.placeId,
    buildingName: parsed.data.buildingName,
    floors: parsed.data.floors.map((floor) => ({
      levelIndex: floor.levelIndex,
      label: floor.label,
      floorPlanImageUrl: floor.floorPlanImageUrl,
      pois: floor.pois,
      edges: floor.edges,
    })),
  });

  if (
    parsed.data.externalVendorId ||
    parsed.data.positioningVendor ||
    parsed.data.positioningEmbedUrl
  ) {
    await prisma.accessVenueBuilding.update({
      where: { id: building.id },
      data: {
        externalVendorId: parsed.data.externalVendorId,
        positioningVendor: parsed.data.positioningVendor,
        positioningEmbedUrl: parsed.data.positioningEmbedUrl,
      },
    });
  }

  return jsonOk({ buildingId: building.id }, 201);
}
