import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationOrganisationsPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin participation"
      title="Community organisations"
      description="Verify community organisations, review disputes, and keep source references current."
      rows={rowsForParticipationTopic("Organisations")}
    />
  );
}
