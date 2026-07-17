import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { ORGANISER_PARTICIPATION_NAV } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CommunityOrganiserPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Community organiser"
      title="Community organiser portal"
      description="Manage community listings, events, access information, and participant-approved questions without seeing private reflections or sensitive affiliations."
      navItems={ORGANISER_PARTICIPATION_NAV}
    />
  );
}
