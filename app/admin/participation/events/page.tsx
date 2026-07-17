import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationEventsPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin participation"
      title="Events"
      description="Review community events, source freshness, access evidence, and moderation status."
      rows={rowsForParticipationTopic("Events")}
    />
  );
}
