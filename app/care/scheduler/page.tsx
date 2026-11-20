import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CareSchedulerBoard } from "@/components/care/scheduler/CareSchedulerBoard";
import { requirePermission } from "@/lib/auth/guards";
import { loadParticipantCareWeek } from "@/lib/care/scheduler/load-week";
import { mondayOfWeek } from "@/lib/care/scheduler/ui-model";
import { isCareSchedulerUiEnabled } from "@/lib/config/care-scheduler";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Care Scheduler | MapAble" };

export default async function ParticipantCareSchedulerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requirePermission("care:read:self");
  if (!isCareSchedulerUiEnabled()) notFound();
  const { week } = await searchParams;
  const weekStart = mondayOfWeek(week);
  const data = await loadParticipantCareWeek(user.id, weekStart);

  return <CareSchedulerBoard role="participant" weekStart={weekStart} data={data} />;
}
