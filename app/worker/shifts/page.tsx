import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { workerProfileForUser } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Shifts | MapAble Worker" };

export default async function WorkerShiftsPage() {
  const user = await requirePermission("care:shift:work");
  const profile = await workerProfileForUser(user.id);
  if (!profile) {
    return (
      <p className="text-muted-foreground">
        No worker profile linked to your account. Contact your provider admin.
      </p>
    );
  }

  const shifts = await prisma.careShift.findMany({
    where: { workerProfileId: profile.id },
    orderBy: { startAt: "desc" },
    take: 30,
    include: { careRequest: { select: { title: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">Your shifts</h1>
      <p className="text-sm text-muted-foreground">
        Only shifts assigned to you appear here.
      </p>
      {shifts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No shifts yet. When assigned, open a shift to start work and complete
          your service log.
        </p>
      ) : (
        <ul className="space-y-3">
          {shifts.map((s) => (
            <li key={s.id}>
              <Link
                href={`/worker/shifts/${s.id}`}
                className="block min-h-[4.5rem] rounded-xl border border-border p-4 hover:border-primary/40"
              >
                <span className="font-medium">{s.careRequest.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {s.startAt.toLocaleString("en-AU")} — {s.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
