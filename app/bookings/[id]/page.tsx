import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BookingTimeline,
  BookingStatusPanel,
} from "@/components/bookings/BookingTimeline";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Booking | MapAble" };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, participantId: user.id },
    include: {
      segments: { orderBy: { sortOrder: "asc" } },
      assignedOrganisation: { select: { id: true, name: true } },
      conversations: { take: 1, select: { id: true } },
    },
  });

  if (!booking) notFound();

  const threadId = booking.conversations[0]?.id;

  return (
    <PageContainer title="Booking details">
      <Link
        href="/bookings"
        className="text-sm text-blue-800 font-medium mb-4 inline-block"
      >
        ← Back to bookings
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold capitalize">
          {booking.bookingType.replace("_", " + ")}
        </h2>
        <BookingStatusPanel status={booking.status} />
      </div>

      <dl className="grid max-w-xl gap-3 text-sm text-slate-800 mb-6">
        <div>
          <dt className="font-medium">Requested start</dt>
          <dd>{new Date(booking.requestedStart).toLocaleString("en-AU")}</dd>
        </div>
        {booking.assignedOrganisation ? (
          <div>
            <dt className="font-medium">Provider</dt>
            <dd>
              <Link
                href={`/providers/${booking.assignedOrganisation.id}`}
                className="text-blue-800"
              >
                {booking.assignedOrganisation.name}
              </Link>
            </dd>
          </div>
        ) : null}
        {booking.participantNotes ? (
          <div>
            <dt className="font-medium">Your notes</dt>
            <dd>{booking.participantNotes}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-3">
        {threadId ? (
          <Link
            href={`/messages/${threadId}`}
            className="min-h-11 inline-flex items-center px-4 rounded-md border border-slate-300 font-medium"
          >
            Open messages
          </Link>
        ) : (
          <Link
            href="/messages"
            className="min-h-11 inline-flex items-center px-4 rounded-md border border-slate-300 font-medium"
          >
            Messages
          </Link>
        )}
        {["accepted", "confirmed", "completed", "in_progress"].includes(
          booking.status
        ) ? (
          <Link
            href={`/bookings/${booking.id}/service-log`}
            className="min-h-11 inline-flex items-center px-4 rounded-md bg-slate-100 font-medium"
          >
            View service log
          </Link>
        ) : null}
      </div>

      {booking.segments.length > 0 ? (
        <section className="mt-8">
          <h3 className="font-semibold mb-2">Timeline</h3>
          <BookingTimeline
            segments={booking.segments}
            bookingType={booking.bookingType}
          />
        </section>
      ) : null}
    </PageContainer>
  );
}
