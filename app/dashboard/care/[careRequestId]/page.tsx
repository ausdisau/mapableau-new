import Link from "next/link";

import { LinkedTransportBanner } from "@/components/care/LinkedTransportBanner";
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
  });
  if (!request) {
    return <p role="alert">Care request not found.</p>;
  }

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
      <CareRequestActions
        careRequestId={request.id}
        status={request.status}
        linkedTransportRequired={request.linkedTransportRequired}
      />
      {request.linkedTransportRequired ? (
        <LinkedTransportBanner careRequestId={request.id} />
      ) : null}
      {request.bookingId ? (
        <Link
          href={`/dashboard/bookings/${request.bookingId}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View booking timeline
        </Link>
      ) : null}
      <Link href="/dashboard/care/shifts" className="text-primary underline">
        View care shifts
      </Link>
    </div>
  );
}
