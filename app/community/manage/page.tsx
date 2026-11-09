import { notFound } from "next/navigation";

import CommunityLiveAdmin from "@/components/community-live/CommunityLiveAdmin";
import { requireAdmin } from "@/lib/auth/guards";
import { evaluateCommunityPilotAccess } from "@/lib/community-live/policy";
import { communityLiveEnabled, communityPilotModeEnabled } from "@/lib/community-live/runtime";

export const dynamic = "force-dynamic";

export default async function CommunityManagePage() {
  if (!communityLiveEnabled()) notFound();
  const user = await requireAdmin();
  if (communityPilotModeEnabled()) {
    const decision = evaluateCommunityPilotAccess({
      pilotMode: true,
      userId: user.id,
      allowedIds: process.env.MAPABLE_COMMUNITY_PILOT_USER_IDS ?? "",
    });
    if (decision !== "allowed") notFound();
  }
  return <CommunityLiveAdmin />;
}
