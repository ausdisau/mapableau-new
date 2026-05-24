import Link from "next/link";

import { TodayScheduleList } from "@/components/workforce/TodayScheduleList";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function WorkerHomePage() {
  const user = await requirePermission("care:shift:work");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const shifts = await prisma.careShift.findMany({
    where: {
      workerProfile: { userId: user.id },
      startAt: { gte: today, lt: tomorrow },
    },
    orderBy: { startAt: "asc" },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Today&apos;s shifts</h1>
      <p className="text-muted-foreground">
        Large buttons and plain language for support workers on the go.
      </p>
      <TodayScheduleList
        items={shifts.map((s) => ({
          id: s.id,
          title: "Care shift",
          startAt: s.startAt.toISOString(),
          href: `/worker/shifts/${s.id}`,
        }))}
      />
      <Link href="/dashboard/incidents/new" className="block min-h-11 rounded border p-4 text-center">
        Report an incident
      </Link>
    </main>
  );
}
