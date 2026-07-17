import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CommunityOrganiserOpportunitiesPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Community organiser"
      title="Opportunities"
      description="Create and maintain listings. Sponsored listings are labelled separately and never used to rank participant results."
      rows={rowsForParticipationTopic("Opportunities")}
    />
  );
}
