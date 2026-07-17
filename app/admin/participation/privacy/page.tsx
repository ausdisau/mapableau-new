import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationPrivacyPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin participation"
      title="Privacy"
      description="Monitor sensitive domain defaults, redaction rules, reflection privacy, and score prohibitions."
      rows={rowsForParticipationTopic("Privacy")}
    />
  );
}
