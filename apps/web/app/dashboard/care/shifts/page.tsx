import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareShiftsPage() {
  const user = await requireAuth();
  const shifts = await prisma.careShift.findMany({
    where: { participantId: user.id },
    orderBy: { startAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Care shifts</h1>
      <ul className="space-y-3">
        {shifts.map((s) => (
          <li key={s.id}>
            <Link
              href={`/dashboard/care/shifts/${s.id}`}
              className="block rounded-xl border p-4 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex justify-between gap-2">
                <span>{s.location ?? "Location TBC"}</span>
                <StatusTextBadge status={s.status} />
              </div>
              <time className="text-sm text-muted-foreground" dateTime={s.startAt.toISOString()}>
                {s.startAt.toLocaleString("en-AU")}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
