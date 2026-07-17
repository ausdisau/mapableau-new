import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationModerationPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin participation"
      title="Moderation"
      description="Human moderation queue for unsafe, unclear, disputed, or sensitive community participation content."
      rows={rowsForParticipationTopic("Moderation")}
    />
  );
}
