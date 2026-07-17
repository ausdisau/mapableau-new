import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { ADMIN_PARTICIPATION_NAV } from "@/components/participation/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationPage() {
  await requirePermission("admin:dashboard");
  return (
    <ParticipationPageShell
      eyebrow="Admin"
      title="Participation governance"
      description="Moderate community participation data, access quality, privacy safeguards, and disruption incidents without exposing participant histories."
      navItems={ADMIN_PARTICIPATION_NAV}
    />
  );
}
