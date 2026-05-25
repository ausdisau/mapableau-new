import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareHubPage() {
  const user = await requirePermission("care:read:self");

  const [requests, bookings] = await Promise.all([
    prisma.careRequest.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.careBooking.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { organisation: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold">Care</h1>
      <p className="text-muted-foreground">
        Request disability supports, track bookings, and confirm service delivery.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/care/request"
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          New care request
        </Link>
        <Link href="/care/bookings" className="inline-flex rounded-lg border px-4 py-2 text-sm">
          My bookings
        </Link>
      </div>
      <section>
        <h2 className="text-lg font-semibold">Recent bookings</h2>
        <ul className="mt-2 space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/care/bookings/${b.id}`} className="block rounded-lg border p-3">
                {b.organisation.name} — {b.status}
              </Link>
            </li>
          ))}
          {bookings.length === 0 ? (
            <li className="text-sm text-muted-foreground">No bookings yet.</li>
          ) : null}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Recent requests</h2>
        <ul className="mt-2 space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg border p-3 text-sm">
              {r.title} — {r.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
