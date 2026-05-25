import { ConsentStatusBanner, ParticipantOverviewPanel } from "@/components/support-coordinator/ConsentStatusBanner";
import { GoalProgressPanel } from "@/components/support-coordinator/GoalProgressPanel";
import { PlanReviewReminderPanel } from "@/components/support-coordinator/PlanReviewReminderPanel";
import { ProviderComparisonPanel } from "@/components/support-coordinator/ProviderComparisonPanel";
import { ReferralBuilder } from "@/components/support-coordinator/ReferralBuilder";
import { SupportCoordinationNotes } from "@/components/support-coordinator/SupportCoordinationNotes";
import { requirePermission } from "@/lib/auth/guards";
import { compareProvidersForParticipant } from "@/lib/support-coordination/referral-service";
import { getParticipantOverviewForCoordinator } from "@/lib/support-coordination/support-coordination-service";

export default async function SupportCoordinatorParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("coordinator:portal");
  const { id } = await params;

  const overview = await getParticipantOverviewForCoordinator({
    coordinatorId: user.id,
    participantId: id,
    actorRole: user.primaryRole,
  });

  let providers: Awaited<ReturnType<typeof compareProvidersForParticipant>> = [];
  if (overview.consentActive) {
    try {
      providers = await compareProvidersForParticipant({
        coordinatorId: user.id,
        participantId: id,
        actorRole: user.primaryRole,
      });
    } catch {
      providers = [];
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="font-heading text-2xl font-bold">Participant overview</h1>
      <ConsentStatusBanner
        consentActive={overview.consentActive}
        message={overview.message}
      />
      <ParticipantOverviewPanel
        consentActive={overview.consentActive}
        profile={overview.data?.profile ?? null}
        bookingCount={overview.data?.bookingCount}
      />
      {overview.consentActive && overview.data ? (
        <>
          <GoalProgressPanel goals={overview.data.goals} consentActive />
          <PlanReviewReminderPanel reminders={overview.data.reminders} />
          <ProviderComparisonPanel providers={providers} />
          <SupportCoordinationNotes notes={overview.data.notes} />
          <ReferralBuilder participantId={id} />
        </>
      ) : null}
    </div>
  );
}
