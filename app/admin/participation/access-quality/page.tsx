import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationAccessQualityPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin participation"
      title="Access quality"
      description="Audit evidence level, last-checked dates, valid-until dates, uncertainty, and linked AccessOps asset IDs."
      rows={rowsForParticipationTopic("Access quality")}
    />
  );
}
