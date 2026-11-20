import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CareSchedulerBoard } from "@/components/care/scheduler/CareSchedulerBoard";
import { requirePermission } from "@/lib/auth/guards";
import { loadWorkerCareWeek } from "@/lib/care/scheduler/load-week";
import { mondayOfWeek } from "@/lib/care/scheduler/ui-model";
import { isCareSchedulerUiEnabled } from "@/lib/config/care-scheduler";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Worker Schedule | MapAble" };

export default async function WorkerCareSchedulerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requirePermission("care:shift:work");
  if (!isCareSchedulerUiEnabled()) notFound();
  const params = await searchParams;
  const weekStart = mondayOfWeek(params.week);
  const data = await loadWorkerCareWeek(user.id, weekStart);

  return <CareSchedulerBoard role="worker" weekStart={weekStart} data={data} />;
}
