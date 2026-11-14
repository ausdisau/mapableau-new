import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessNeedsSummary } from "@/components/care/AccessNeedsSummary";
import { ServiceAgreementPlaceholder } from "@/components/care/ServiceAgreementPlaceholder";
import { ServiceLogConfirmDispute } from "@/components/care/ServiceLogConfirmDispute";
import { SupportTasksSummary } from "@/components/care/SupportTasksSummary";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePermission } from "@/lib/auth/guards";
import { assertParticipantOwnsBooking } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

function formatSchedule(value: Date | null) {
  if (!value) return "Timing is still to be agreed";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(value);
}

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
      shifts: { orderBy: { startAt: "asc" }, take: 5 },
    },
  });
  if (!booking) notFound();
  try {
    assertParticipantOwnsBooking(user, booking);
  } catch {
    notFound();
  }

  const log = booking.serviceLogs[0];

  return (
    <div className="space-y-8">
      <CorePageHeader
        eyebrow="Booking details"
        title={booking.careRequest.title}
        description={`${booking.organisation.name} · ${formatSchedule(
          booking.scheduledStartAt
        )}`}
        className="border-0 pb-0"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/care/bookings">Back to bookings</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/care/service-logs">View all support records</Link>
          </Button>
        </div>
      </CorePageHeader>

      <Card className="border-border/70 shadow-none">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Booking status
            </p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            MapAble can organise updates, but a provider or worker is not
            confirmed by an automated decision alone. Contact support if this
            status does not match what you agreed.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SupportTasksSummary tasks={booking.tasks} />
        <AccessNeedsSummary
          summary={booking.careRequest.accessRequirementsSummary}
          needs={booking.accessNeeds}
        />
      </div>

      <ServiceAgreementPlaceholder
        title={booking.serviceAgreement?.placeholderTitle}
        summary={booking.serviceAgreement?.placeholderSummary}
      />

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-[#0C1833]">
            Latest support record
          </CardTitle>
        </CardHeader>
        <CardContent>
          {log ? (
            <ServiceLogConfirmDispute
              logId={log.id}
              careShiftId={log.careShiftId}
              status={log.status}
              organisationId={booking.organisationId}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5">
              <p className="text-sm leading-6 text-muted-foreground">
                A support record will appear after your worker submits the
                completed shift. You will be able to approve it or raise a
                concern.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
