import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requirePermission } from "@/lib/auth/guards";
import { routes } from "@/lib/routing/canonical-routes";
import { prisma } from "@/lib/prisma";

export default async function CareShiftsPage() {
  const user = await requirePermission("care:read:self");
  const shifts = await prisma.careShift.findMany({
    where: { participantId: user.id },
    orderBy: { startAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Care shifts</h1>
      <p className="text-sm text-muted-foreground">
        Shifts linked to your care requests. Workers check in via the worker portal.
      </p>
      <ul className="space-y-3">
        {shifts.map((s) => (
          <li key={s.id}>
            <Link
              href={routes.care.shift(s.id)}
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
        {shifts.length === 0 ? (
          <li className="text-sm text-muted-foreground">No shifts scheduled yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
