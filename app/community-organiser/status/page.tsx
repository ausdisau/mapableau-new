import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CommunityOrganiserStatusPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Community organiser"
      title="Listing status"
      description="Review draft, pending, published, hidden, suspended, expired, and archived states. Auto-publish remains disabled."
      rows={rowsForParticipationTopic("Status")}
    />
  );
}
