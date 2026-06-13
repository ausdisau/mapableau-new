import {
  computeIndoorRoute,
  parseIndoorRoutingProfile,
} from "@/lib/access-indoor/routing-service";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { indoorRouteQuerySchema } from "@/types/access-indoor";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const url = new URL(req.url);
  const parsed = indoorRouteQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries())
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const buildings = await prisma.accessVenueBuilding.findMany({
    where: { placeId, status: "published" },
    include: {
      floors: {
        where: { status: "published" },
        include: {
          pois: true,
          edges: true,
        },
      },
    },
  });

  const nodes = buildings.flatMap((building) =>
    building.floors.flatMap((floor) =>
      floor.pois.map((poi) => ({
        poi,
        floorId: floor.id,
        floorLabel: floor.label,
      }))
    )
  );

  const edges = buildings.flatMap((building) =>
    building.floors.flatMap((floor) => floor.edges)
  );

  const route = computeIndoorRoute({
    nodes,
    edges,
    fromPoiId: parsed.data.from,
    toPoiId: parsed.data.to,
    profile: parseIndoorRoutingProfile({
      wheelchair: parsed.data.wheelchair,
      avoidStairs: parsed.data.avoidStairs,
    }),
  });

  if (!route) {
    return jsonError("No accessible route found between those points", 404);
  }

  return jsonOk({ route });
}
