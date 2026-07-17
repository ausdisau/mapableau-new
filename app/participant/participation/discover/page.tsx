import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationDiscoverPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Participant-approved discovery"
      title="Discover opportunities"
      description="Search by keyword, domain, date, delivery mode, and access needs. Results remain unranked and sponsored listings are separated."
      rows={rowsForParticipationTopic("Discovery")}
    />
  );
}
