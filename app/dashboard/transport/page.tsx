import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function TransportPage() {
  const user = await requireAuth();
  const bookings = await prisma.transportBooking.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Transport bookings</h1>
        <Link
          href="/dashboard/transport/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          New booking
        </Link>
      </header>
      <ul className="space-y-3">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link href={`/dashboard/transport/${b.id}`} className="block rounded-xl border p-4">
              <StatusTextBadge status={b.status} />
              <p className="mt-2 font-medium">{b.pickupAddress}</p>
              <p className="text-sm">to {b.dropoffAddress}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
