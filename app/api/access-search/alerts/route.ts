import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

/** Active access alerts (optional placeId filter). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeId = url.searchParams.get("placeId") ?? undefined;
  const limit = Math.min(
    Number(url.searchParams.get("limit") ?? "50") || 50,
    100,
  );

  const alerts = await prisma.accessPlaceAlert.findMany({
    where: {
      status: "active",
      ...(placeId ? { placeId } : {}),
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { startsAt: "desc" },
    take: limit,
    include: {
      place: { select: { id: true, name: true, suburb: true } },
    },
  });

  return jsonOk({
    alerts: alerts.map((a) => ({
      id: a.id,
      placeId: a.placeId,
      placeName: a.place.name,
      suburb: a.place.suburb,
      severity: a.severity,
      title: a.title,
      body: a.body,
      source: a.source,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt?.toISOString() ?? null,
    })),
  });
}
