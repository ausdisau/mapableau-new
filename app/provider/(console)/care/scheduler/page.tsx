import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CareSchedulerBoard } from "@/components/care/scheduler/CareSchedulerBoard";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";
import { loadProviderCareWeek } from "@/lib/care/scheduler/load-week";
import { mondayOfWeek } from "@/lib/care/scheduler/ui-model";
import { isCareSchedulerUiEnabled } from "@/lib/config/care-scheduler";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Care Roster Scheduler | MapAble" };

export default async function ProviderCareSchedulerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; organisationId?: string }>;
}) {
  const user = await requirePermission("care:read:org");
  if (!isCareSchedulerUiEnabled()) notFound();

  const params = await searchParams;
  const organisationIds = await getUserOrganisationIds(user.id);
  if (params.organisationId && !organisationIds.includes(params.organisationId)) {
    notFound();
  }
  const organisationId = params.organisationId || organisationIds[0];
  if (!organisationId) {
    return <p className="p-6 text-foreground">You need a provider organisation membership to view its Care scheduler.</p>;
  }

  const weekStart = mondayOfWeek(params.week);
  const data = await loadProviderCareWeek(organisationId, weekStart);

  return (
    <CareSchedulerBoard
      viewerRole="provider"
      weekStart={weekStart}
      data={data}
      organisationId={organisationId}
    />
  );
}
