import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { PARTICIPANT_PARTICIPATION_NAV } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Inclusive life planner"
      title="Your participation"
      description="Plan community, cultural, social, learning, work, advocacy, faith, travel, online, or participant-defined life participation in your own words."
      navItems={PARTICIPANT_PARTICIPATION_NAV}
    />
  );
}
