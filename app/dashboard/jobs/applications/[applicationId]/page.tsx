import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { SupportBundlePanel } from "@/components/jobs/SupportBundlePanel";
import { requireAuth } from "@/lib/auth/guards";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const user = await requireAuth();
  const { applicationId } = await params;
  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, participantId: user.id },
    include: { job: true },
  });
  if (!app) return <p role="alert">Application not found.</p>;

  const view = sanitizeApplicationForViewer(app, {
    isParticipant: true,
    isEmployerWithConsent: false,
    isAdmin: false,
  });
  const linkedEvents = await prisma.orchestrationEvent.findMany({
    where: { jobApplicationId: app.id },
    orderBy: { createdAt: "desc" },
  });
  const transportIds = linkedEvents
    .map((event) => event.transportBookingId)
    .filter((id): id is string => Boolean(id));
  const careIds = linkedEvents
    .map((event) => event.careRequestId)
    .filter((id): id is string => Boolean(id));
  const [transportBookings, careRequests] = await Promise.all([
    prisma.transportBooking.findMany({ where: { id: { in: transportIds } } }),
    prisma.careRequest.findMany({ where: { id: { in: careIds } } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{app.job.title}</h1>
      <StatusTextBadge status={app.status} />
      <p>{view.applicantSummary}</p>
      {view.reasonableAdjustmentRequest ? (
        <p className="rounded-lg border p-3 text-sm">
          {view.reasonableAdjustmentRequest}
        </p>
      ) : null}
      <SupportBundlePanel
        applicationId={app.id}
        transportSupportNeeded={app.transportSupportNeeded}
        careSupportNeeded={app.careSupportNeeded}
      />
      {transportBookings.length || careRequests.length ? (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="font-heading text-lg font-semibold">
            Linked services
          </h2>
          {transportBookings.map((booking) => (
            <p key={booking.id} className="text-sm">
              Transport: {booking.pickupAddress} to {booking.dropoffAddress} (
              {booking.status})
            </p>
          ))}
          {careRequests.map((request) => (
            <p key={request.id} className="text-sm">
              Care: {request.title} ({request.status})
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
