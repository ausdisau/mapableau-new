import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { loadPilotScoped } from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId]/reviews */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:operations:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const reviews = await prisma.pilotDailyReview.findMany({
    where: { pilotId },
    orderBy: { reviewDate: "desc" },
    take: 60,
    select: {
      id: true,
      reviewDate: true,
      outcome: true,
      notes: true,
      reviewedById: true,
      createdAt: true,
    },
  });

  return jsonNdisOk({
    pilotId,
    reviews: reviews.map((r) => ({
      ...r,
      reviewDate: r.reviewDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
