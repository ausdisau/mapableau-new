import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { nearbyTransportOperatorOrganisationIds } from "@/lib/geo/transport-locations";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:manage:any");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radiusKm = Number(url.searchParams.get("radiusKm") ?? "25");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return jsonError("lat and lng are required", 400);
  }

  const ids = await nearbyTransportOperatorOrganisationIds({
    lat,
    lng,
    radiusKm,
  });
  const operators = await prisma.organisation.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, contactEmail: true, contactPhone: true },
    orderBy: { name: "asc" },
  });
  return jsonOk({ operators, radiusKm });
}
