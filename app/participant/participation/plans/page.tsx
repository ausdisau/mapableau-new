import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationPlansPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Participant-approved plans"
      title="Participation plans"
      description="Draft, approve, execute, or cancel plans. Plans reference calendar, booking, and journey IDs rather than duplicating those systems."
      rows={rowsForParticipationTopic("Plans")}
    />
  );
}
