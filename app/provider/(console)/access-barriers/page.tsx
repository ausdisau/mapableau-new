import { ProviderBarrierInbox } from "@/components/barrier-report/ProviderBarrierInbox";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Access barrier reports | Provider" };

export default async function ProviderAccessBarriersPage() {
  const user = await requireAuth();
  // Ensure the user belongs to at least one organisation in the provider console.
  await getUserOrganisationIds(user.id);
  const canManage = hasPermission(user.primaryRole, "care:manage:org");

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Access barrier reports</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review community reports about access barriers. Move each report through
          received, reviewing, actioned and closed. Reporter personal details stay
          private.
        </p>
      </header>
      <ProviderBarrierInbox
        canManage={canManage}
        initialReports={reports.map((report) => ({
          ...report,
          observedAt: report.observedAt?.toISOString() ?? null,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
