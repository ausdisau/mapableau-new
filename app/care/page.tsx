import Link from "next/link";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { mapableHubPageStackClass, mapableSectionHeadingClass } from "@/lib/brand/styles";
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
    <div className={mapableHubPageStackClass}>
      <CorePageHeader
        eyebrow="Participant"
        title="Care"
        description="Request disability supports, track bookings, and confirm service delivery."
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="default" size="default">
            <Link href="/care/request">New care request</Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link href="/care/bookings">My bookings</Link>
          </Button>
        </div>
      </CorePageHeader>

      <section>
        <h2 className={mapableSectionHeadingClass}>Recent bookings</h2>
        <ul className="mt-3 space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/care/bookings/${b.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium">{b.organisation.name}</span>
                <StatusBadge status={b.status} />
              </Link>
            </li>
          ))}
          {bookings.length === 0 ? (
            <li className="text-sm text-muted-foreground">No bookings yet.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className={mapableSectionHeadingClass}>Recent requests</h2>
        <ul className="mt-3 space-y-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4"
            >
              <span className="font-medium">{r.title}</span>
              <StatusBadge status={r.status} />
            </li>
          ))}
          {requests.length === 0 ? (
            <li className="text-sm text-muted-foreground">No requests yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
