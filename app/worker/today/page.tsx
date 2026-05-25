import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";

import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";
import { BigActionButton } from "@/components/field/BigActionButton";
import { FieldModeShell } from "@/components/field/FieldModeShell";
import { requirePermission } from "@/lib/auth/guards";
import { workerProfileForUser } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Today | MapAble Worker" };

export default async function WorkerTodayPage() {
  const user = await requirePermission("care:shift:work");
  const profile = await workerProfileForUser(user.id);
  if (!profile) {
    return (
      <p className="text-muted-foreground">
        No worker profile linked to your account. Contact your provider admin.
      </p>
    );
  }

  const now = new Date();
  const shifts = await prisma.careShift.findMany({
    where: {
      workerProfileId: profile.id,
      startAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    orderBy: { startAt: "asc" },
    include: { careRequest: { select: { title: true } } },
  });

  const items = shifts.map((s) => ({
    id: s.id,
    title: s.careRequest.title,
    time: `${s.startAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} — ${s.status}`,
  }));

  return (
    <FieldModeShell title="Today's shifts">
      <TodayScheduleCard
        items={items}
        viewAllHref="/worker/shifts"
        emptyMessage="No shifts scheduled for today."
      />
      {shifts[0] ? (
        <BigActionButton
          href={`/worker/shifts/${shifts[0].id}`}
          label="Open next shift"
          variant="primary"
        />
      ) : (
        <BigActionButton href="/worker/shifts" label="View shifts" variant="primary" />
      )}
      <BigActionButton
        href="/worker/report-issue"
        label="Report safety issue"
        variant="secondary"
      />
      <p className="text-sm text-muted-foreground">
        <Link href="/worker/shifts" className="text-primary underline">
          All shifts
        </Link>
      </p>
    </FieldModeShell>
  );
}
