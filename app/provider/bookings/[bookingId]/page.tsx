import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingEventTimeline } from "@/components/bookings/BookingEventTimeline";
import { BookingStatusPanel } from "@/components/bookings/BookingTimeline";
import { AssignWorkerPanel } from "@/components/provider/AssignWorkerPanel";
import { BookingStatusActions } from "@/components/provider/BookingStatusActions";
import { CreateInvoiceButton } from "@/components/provider/CreateInvoiceButton";
import { ServiceCompletionForm } from "@/components/provider/ServiceCompletionForm";
import { requireAuth } from "@/lib/auth/guards";
import { listBookingTimeline } from "@/lib/bookings/timeline-service";
import { prisma } from "@/lib/prisma";

export default async function ProviderBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const user = await requireAuth();
  const { bookingId } = await params;

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
  });
  const orgIds = memberships.map((m) => m.organisationId);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, assignedOrganisationId: { in: orgIds } },
    include: {
      participant: { select: { name: true } },
      conversations: { select: { id: true }, take: 1 },
      invoices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!booking) notFound();

  const timeline = await listBookingTimeline(bookingId, false);

  const orgWorkers = booking.assignedOrganisationId
    ? await prisma.organisationMember.findMany({
        where: {
          organisationId: booking.assignedOrganisationId,
          role: { in: ["support_worker", "driver"] },
        },
        include: { user: { select: { id: true, name: true } } },
      })
    : [];

  const workers = orgWorkers.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/provider/bookings"
        className="text-sm text-primary hover:underline"
      >
        ← Bookings
      </Link>
      <h1 className="font-heading text-2xl font-bold capitalize">
        {booking.bookingType.replace("_", " + ")} booking
      </h1>
      <p className="text-sm">Participant: {booking.participant.name}</p>
      <p className="text-sm">
        Accessibility: {booking.accessibilitySummary ?? "Not specified"}
      </p>
      <BookingStatusPanel status={booking.status} />
      {booking.invoices[0] && (
        <p className="text-sm">
          Invoice:{" "}
          <Link
            href={`/provider/invoices/${booking.invoices[0].id}`}
            className="underline"
          >
            {booking.invoices[0].status}
          </Link>
        </p>
      )}
      {booking.conversations[0] && (
        <Link
          href={`/provider/messages?conversation=${booking.conversations[0].id}`}
          className="inline-block rounded-md border px-4 py-2"
        >
          Open message thread
        </Link>
      )}
      <BookingStatusActions bookingId={booking.id} status={booking.status} />
      <AssignWorkerPanel bookingId={booking.id} workers={workers} />
      <ServiceCompletionForm bookingId={booking.id} />
      {booking.status === "completed" && (
        <CreateInvoiceButton bookingId={booking.id} />
      )}
      <section>
        <h2 className="font-semibold">Timeline</h2>
        <BookingEventTimeline events={timeline} />
      </section>
    </div>
  );
}
