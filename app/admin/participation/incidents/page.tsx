import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationIncidentsPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin participation"
      title="Participation incidents"
      description="Review access changes, organiser issues, and disruption follow-up without exposing participant private histories."
      rows={rowsForParticipationTopic("Incidents")}
    />
  );
}
