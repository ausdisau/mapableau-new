import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CommunityOrganiserQuestionsPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Community organiser"
      title="Participant-approved questions"
      description="Prepare and answer organiser questions only when a participant has approved the question flow."
      rows={rowsForParticipationTopic("Questions")}
    />
  );
}
