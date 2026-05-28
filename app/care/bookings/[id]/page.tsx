import { notFound } from "next/navigation";

import { AccessNeedsSummary } from "@/components/care/AccessNeedsSummary";
import { ModuleCheckoutButton } from "@/components/billing/ModuleCheckoutButton";
import { ServiceAgreementPlaceholder } from "@/components/care/ServiceAgreementPlaceholder";
import { ServiceLogConfirmDispute } from "@/components/care/ServiceLogConfirmDispute";
import { SupportTasksSummary } from "@/components/care/SupportTasksSummary";
import { requirePermission } from "@/lib/auth/guards";
import { assertParticipantOwnsBooking } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export default async function CareBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("care:read:self");
  const { id } = await params;

  const booking = await prisma.careBooking.findUnique({
    where: { id },
    include: {
      careRequest: true,
      organisation: { select: { name: true } },
      serviceAgreement: true,
      serviceLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      accessNeeds: true,
      shifts: { take: 5 },
    },
  });
  if (!booking) notFound();
  try {
    assertParticipantOwnsBooking(user, booking);
  } catch {
    notFound();
  }

  const log = booking.serviceLogs[0];
  const lifecycleAgreement = await prisma.serviceAgreement.findFirst({
    where: {
      participantId: booking.participantId,
      organisationId: booking.organisationId,
      status: { notIn: ["cancelled", "expired"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{booking.careRequest.title}</h1>
      <p className="text-sm text-muted-foreground">
        {booking.organisation.name} · {booking.status}
      </p>
      <SupportTasksSummary tasks={booking.tasks} />
      <AccessNeedsSummary
        summary={booking.careRequest.accessRequirementsSummary}
        needs={booking.accessNeeds}
      />
      <ServiceAgreementPlaceholder
        title={booking.serviceAgreement?.placeholderTitle}
        summary={booking.serviceAgreement?.placeholderSummary}
      />
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Service agreement lifecycle</h2>
        {lifecycleAgreement ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Current agreement status: {lifecycleAgreement.status}.{" "}
            <a
              href={`/dashboard/service-agreements/${lifecycleAgreement.id}`}
              className="font-medium text-primary hover:underline"
            >
              Open agreement
            </a>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No active lifecycle agreement found yet. Your provider can send one for review.
          </p>
        )}
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay this care booking securely in Stripe Checkout.
        </p>
        <div className="mt-3">
          <ModuleCheckoutButton endpoint={`/api/care/bookings/${booking.id}/checkout`} />
        </div>
      </section>
      {log ? (
        <ServiceLogConfirmDispute logId={log.id} status={log.status} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Service log will appear after your worker completes the shift.
        </p>
      )}
    </div>
  );
}
