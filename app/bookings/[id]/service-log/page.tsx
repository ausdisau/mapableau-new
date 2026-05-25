import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/PageContainer";
import { ServiceLogReviewCard } from "@/components/service-logs/ServiceLogReviewCard";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export default async function ParticipantServiceLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id: bookingId } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, participantId: user.id },
  });
  if (!booking) notFound();

  const serviceLog = await prisma.serviceLog.findFirst({
    where: { bookingId },
    include: { approvals: { take: 1 } },
  });

  return (
    <PageContainer title="Service log">
      <Link href={`/bookings/${bookingId}`} className="text-sm text-blue-800 font-medium mb-4 inline-block">
        ← Back to booking
      </Link>
      {!serviceLog ? (
        <p role="status" className="text-slate-600">
          No service log has been submitted for this booking yet.
        </p>
      ) : (
        <ServiceLogReviewCard
          serviceLog={{
            id: serviceLog.id,
            status: serviceLog.status,
            serviceSummary: serviceLog.serviceSummary,
            serviceDate: serviceLog.serviceDate.toISOString(),
            durationMinutes: serviceLog.durationMinutes,
          }}
          canAct={serviceLog.status === "participant_review"}
        />
      )}
    </PageContainer>
  );
}
