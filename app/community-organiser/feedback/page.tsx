import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CommunityOrganiserFeedbackPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Community organiser"
      title="Feedback"
      description="See safe operational feedback only. Private participant reflections and histories are not exposed."
      rows={rowsForParticipationTopic("Feedback")}
    />
  );
}
