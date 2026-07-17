import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationReflectionsPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Private reflections"
      title="Reflections"
      description="Reflections are private by default and are never exposed to community organisers."
      rows={rowsForParticipationTopic("Reflections")}
    />
  );
}
