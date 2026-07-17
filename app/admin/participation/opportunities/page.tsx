import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationOpportunitiesPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin participation"
      title="Opportunities"
      description="Moderate opportunity listings, sponsor labelling, funding claim language, and no-ranking safeguards."
      rows={rowsForParticipationTopic("Opportunities")}
    />
  );
}
