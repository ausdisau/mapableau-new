import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

/**
 * Platform moderation inbox for barrier reports (including unassigned).
 * Requires mapable_admin. Never returns contact fields to accidental clients —
 * contact is only available via a dedicated support tooling path later.
 */
export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const reports = await prisma.accessBarrierReport.findMany({
    where: { isDraft: false, status: { not: "draft" } },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    take: 200,
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
      organisationId: true,
      anonymous: true,
      triageNotes: true,
      statusHistory: true,
      createdAt: true,
      updatedAt: true,
      // contactEmail / contactPhone intentionally omitted from list.
    },
  });

  return jsonOk({ reports });
}
