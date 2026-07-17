import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationGoalsPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Participant-defined goals"
      title="Participation goals"
      description="Create, clarify, confirm, pause, or change goals. Changing a goal is not treated as failure."
      rows={rowsForParticipationTopic("Goals")}
    />
  );
}
