import Link from "next/link";

import { CareListCard } from "@/components/care/CareListCard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareBookingsPage() {
  const user = await requirePermission("care:read:self");
  const bookings = await prisma.careBooking.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      organisation: { select: { name: true } },
      careRequest: { select: { title: true } },
    },
  });

  return (
    <div className="space-y-8">
      <CorePageHeader
        eyebrow="Bookings"
        title="My care bookings"
        description="Track provider responses and service delivery. Status updates appear here as your support progresses."
        className="border-0 pb-0"
      />

      <Button asChild variant="outline" size="default">
        <Link href="/care/request">New support request</Link>
      </Button>

      <ul className="space-y-3">
        {bookings.map((b) => (
          <li key={b.id}>
            <CareListCard
              href={`/care/bookings/${b.id}`}
              title={b.careRequest.title}
              subtitle={b.organisation.name}
              status={b.status}
            />
          </li>
        ))}
        {bookings.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No bookings yet.{" "}
            <Link href="/care/request" className="font-medium text-primary hover:underline">
              Describe what you need
            </Link>{" "}
            to create a request and review your draft plan first.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
