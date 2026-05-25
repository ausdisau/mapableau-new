import { PageContainer } from "@/components/layout/PageContainer";
import { ParticipantProfileForm } from "@/components/participant/ParticipantProfileForm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getParticipantProfileBundle } from "@/lib/participants/participant-profile-service";

export default async function ParticipantProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const bundle = await getParticipantProfileBundle(user.id);

  return (
    <PageContainer title="Your profile">
      <p className="text-sm text-slate-600 mb-4">
        NDIS number and plan documents are optional. Add them only when you are ready.
      </p>
      <ParticipantProfileForm
        initial={{
          displayName: bundle.profile?.displayName ?? user.name,
          preferredName: bundle.profile?.preferredName ?? "",
          homeSuburb: bundle.profile?.homeSuburb ?? "",
          homeState: bundle.profile?.homeState ?? "",
          participantNotes: bundle.profile?.participantNotes ?? "",
          accessNeedsSummary: bundle.preferences?.accessNeedsSummary ?? "",
          mainSupportGoals: bundle.preferences?.mainSupportGoals ?? "",
        }}
      />
    </PageContainer>
  );
}
