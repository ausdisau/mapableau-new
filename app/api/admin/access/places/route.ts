import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;

  const places = await prisma.accessPlace.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      location: true,
      _count: { select: { reviews: true, alerts: true } },
    },
  });

  return jsonOk({ places });
}

export async function PATCH(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = await req.json();
  const { placeId, status } = body as { placeId?: string; status?: string };

  if (!placeId || !status) {
    return jsonError("placeId and status required", 400);
  }

  const place = await prisma.accessPlace.update({
    where: { id: placeId },
    data: { status: status as never },
  });

  return jsonOk({ place: { id: place.id, status: place.status } });
}
