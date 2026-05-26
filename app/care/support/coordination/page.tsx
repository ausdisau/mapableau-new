import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareSupportCoordinationPage() {
  const user = await requirePermission("care:read:self");

  const [assessments, referrals, careRequests, bookings] = await Promise.all([
    prisma.supportNeedsAssessment.findMany({
      where: { participantId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, status: true, submittedAt: true, updatedAt: true },
    }),
    prisma.supportReferral.findMany({
      where: { participantId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, summary: true, status: true, updatedAt: true },
    }),
    prisma.careRequest.findMany({
      where: { participantId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.careBooking.findMany({
      where: { participantId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        organisation: { select: { name: true } },
      },
    }),
  ]);

  type Event = { at: Date; label: string; status: string; href?: string };
  const events: Event[] = [
    ...assessments.map((a) => ({
      at: a.submittedAt ?? a.updatedAt,
      label: "Support needs assessment",
      status: a.status,
      href: "/care/support/assessment",
    })),
    ...referrals.map((r) => ({
      at: r.updatedAt,
      label: r.summary,
      status: r.status,
      href: "/care/support/referrals",
    })),
    ...careRequests.map((c) => ({
      at: c.updatedAt,
      label: c.title,
      status: c.status,
    })),
    ...bookings.map((b) => ({
      at: b.updatedAt,
      label: `Booking — ${b.organisation.name}`,
      status: b.status,
      href: `/care/bookings/${b.id}`,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Coordination timeline</h1>
      <p className="text-sm text-muted-foreground">
        How your assessments, referrals, and care activity connect.
      </p>

      <ol className="space-y-3 border-l-2 pl-4">
        {events.map((e, i) => (
          <li key={i} className="relative">
            <time className="text-xs text-muted-foreground">
              {e.at.toLocaleDateString("en-AU")}
            </time>
            <p className="font-medium">
              {e.href ? (
                <Link href={e.href} className="text-primary underline">
                  {e.label}
                </Link>
              ) : (
                e.label
              )}
            </p>
            <p className="text-sm text-muted-foreground">{e.status}</p>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="text-sm text-muted-foreground">No activity yet.</li>
        ) : null}
      </ol>
    </div>
  );
}
