import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listAvailability } from "@/lib/availability/availability-service";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";

export default async function AvailabilityPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const windows = orgIds[0] ? await listAvailability(orgIds[0]) : [];

  return (
    <div className="space-y-6">
      <header className="flex justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Availability</h1>
        <Link href="/provider/availability/new" className="text-primary underline">
          Add window
        </Link>
      </header>
      <ul>
        {windows.map((w) => (
          <li key={w.id} className="rounded-lg border p-3">
            {w.dayOfWeek}: {w.startTime}–{w.endTime}
          </li>
        ))}
      </ul>
    </div>
  );
}
