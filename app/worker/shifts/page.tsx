import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Shifts | MapAble Worker" };

export default async function WorkerShiftsPage() {
  await requireAuth();

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">Your shifts</h1>
      <p className="text-sm text-muted-foreground">
        Only shifts assigned to you appear here.
      </p>
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No shifts yet. When assigned, open a shift to start work and complete
        your service log.
      </p>
      <Link
        href="/dashboard/care"
        className="inline-flex min-h-11 items-center text-primary underline"
      >
        View care bookings
      </Link>
    </div>
  );
}
