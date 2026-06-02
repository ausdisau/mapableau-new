import Link from "next/link";

import { CareJourneyStrip } from "@/components/care/CareJourneyStrip";
import { CareListCard } from "@/components/care/CareListCard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-10">
      <CorePageHeader
        eyebrow="MapAble Care"
        title="Find and manage your supports"
        description="Describe what you need, review a draft plan, and track bookings — you stay in control before anything goes to providers."
        className="border-0 pb-0"
      />

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default" size="lg">
          <Link href="/care/request">Describe what you need</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/care/find">Find providers</Link>
        </Button>
        <Button asChild variant="secondary" size="default">
          <Link href="/care/bookings">My bookings</Link>
        </Button>
      </div>

      <CareJourneyStrip />

      <section className="space-y-4" aria-labelledby="recent-bookings">
        <div className="flex items-center justify-between gap-2">
          <h2 id="recent-bookings" className="font-heading text-xl font-semibold">
            Recent bookings
          </h2>
          <Link
            href="/care/bookings"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookings yet. Start by describing the support you need.
          </p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li key={b.id}>
                <CareListCard
                  href={`/care/bookings/${b.id}`}
                  title={b.organisation.name}
                  subtitle="Care booking"
                  status={b.status}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="recent-requests">
        <h2 id="recent-requests" className="font-heading text-xl font-semibold">
          Recent requests
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No requests yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id}>
                <CareListCard
                  title={r.title}
                  subtitle={r.requestType.replace(/_/g, " ")}
                  status={r.status}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
