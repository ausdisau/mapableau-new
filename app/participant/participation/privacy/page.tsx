import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationPrivacyPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Social privacy"
      title="Participation privacy"
      description="Faith, advocacy, civic, peer-support, sexuality-related, and participant-defined sensitive information defaults to private."
      rows={rowsForParticipationTopic("Privacy")}
    />
  );
}
