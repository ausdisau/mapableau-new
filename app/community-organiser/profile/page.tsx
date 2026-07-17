import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CommunityOrganiserProfilePage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Community organiser"
      title="Organisation profile"
      description="Maintain organiser identity, verification status, contact information, and source references."
      rows={rowsForParticipationTopic("Organisation profile")}
    />
  );
}
