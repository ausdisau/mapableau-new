import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CommunityOrganiserAccessPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Community organiser"
      title="Event access"
      description="Add access evidence with last-checked and valid-until dates. Unknown or stale access is labelled as uncertain."
      rows={rowsForParticipationTopic("Access")}
    />
  );
}
