import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import { isAccessModerator } from "@/lib/access-community/access-role-policy";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!(await isAccessModerator(user))) return apiForbidden();

  const places = await prisma.accessPlace.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      location: true,
      domainSummaries: true,
      venueProfile: { select: { id: true } },
      _count: {
        select: {
          reviews: { where: { status: "published" } },
          alerts: { where: { status: "active" } },
        },
      },
    },
  });

  return jsonOk({
    places: places.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      status: p.status,
      suburb: p.suburb,
      reviewCount: p._count.reviews,
      activeAlertCount: p._count.alerts,
      claimedByVenue: Boolean(p.venueProfile),
      updatedAt: p.updatedAt,
    })),
  });
}
