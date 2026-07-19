import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

/**
 * Provider inbox for community access barrier reports.
 * Contact details and reporter identity are never returned.
 * Org-scoped place ownership is a follow-up; MVP lists open platform reports
 * for provider operators with care:read:org.
 */
export async function GET() {
  const user = await requireApiPermission("care:read:org");
  if (user instanceof Response) return user;

  const reports = await prisma.accessBarrierReport.findMany({
    where: {
      isDraft: false,
      status: { not: "draft" },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      referenceNumber: true,
      category: true,
      description: true,
      placeName: true,
      placeSlug: true,
      locationDetail: true,
      urgency: true,
      status: true,
      observedAt: true,
      imageUrl: true,
      imageDescription: true,
      anonymous: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return jsonOk({ reports });
}
