import Link from "next/link";

import { CareRequestActions } from "@/components/phase3/CareRequestActions";
import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareRequestDetailPage({
  params,
}: {
  params: Promise<{ careRequestId: string }>;
}) {
  const user = await requireAuth();
  const { careRequestId } = await params;
  const request = await prisma.careRequest.findFirst({
    where: { id: careRequestId, participantId: user.id },
    include: { booking: true },
  });
  if (!request) {
    return <p role="alert">Care request not found.</p>;
  }
  const transportBookings = await prisma.transportBooking.findMany({
    where: {
      OR: [
        { careRequestId: request.id },
        ...(request.bookingId ? [{ bookingId: request.bookingId }] : []),
      ],
    },
    orderBy: { pickupWindowStart: "asc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">{request.title}</h1>
        <StatusTextBadge status={request.status} />
      </header>
      <p>{request.description}</p>
      <p className="text-sm text-muted-foreground">
        Visible to: you, assigned provider (if any), MapAble admins.
      </p>
      {request.booking ? (
        <p className="rounded-lg border p-3 text-sm">
          Booking status: {request.booking.status.replace(/_/g, " ")}
        </p>
      ) : null}
      <CareRequestActions
        careRequestId={request.id}
        status={request.status}
        linkedTransportRequired={request.linkedTransportRequired}
      />
      {request.linkedTransportRequired ? (
        <p className="rounded-lg border p-3 text-sm">
          Linked transport requested.
          {transportBookings.length ? (
            <>
              {" "}
              {transportBookings.map((booking) => (
                <span key={booking.id}>
                  Trip {booking.status.replace(/_/g, " ")}:{" "}
                  {booking.pickupAddress} to {booking.dropoffAddress}.{" "}
                </span>
              ))}
            </>
          ) : null}{" "}
          <Link href="/dashboard/transport" className="text-primary underline">
            View transport bookings
          </Link>
        </p>
      ) : null}
      <Link href="/dashboard/care/shifts" className="text-primary underline">
        View care shifts
      </Link>
    </div>
  );
}
