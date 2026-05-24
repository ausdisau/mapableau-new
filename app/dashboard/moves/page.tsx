import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "MapAble Moves | MapAble Core" };

export default async function MovesDashboardPage() {
  const user = await requireAuth();
  const appointments = await prisma.therapyAppointment.findMany({
    where: { participantId: user.id },
    include: { therapistProfile: true },
    orderBy: { startsAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">MapAble Moves</h1>
          <p className="text-muted-foreground">
            Allied health with verified therapists, telehealth, and home-visit
            safety checks.
          </p>
        </div>
        <Link
          href="/dashboard/moves/book"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          Book therapy
        </Link>
      </header>
      {appointments.length === 0 ? (
        <p role="status">No therapy appointments yet.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/moves/appointments/${a.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">
                    {a.therapistProfile.displayName} —{" "}
                    {a.therapyType.replace(/_/g, " ")}
                  </span>
                  <StatusTextBadge status={a.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.startsAt.toLocaleString()} · {a.deliveryMode.replace(/_/g, " ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
