import { notFound } from "next/navigation";

import CommunityLiveAdmin from "@/components/community-live/CommunityLiveAdmin";
import { requireAdmin } from "@/lib/auth/guards";
import { communityLiveEnabled } from "@/lib/community-live/runtime";

export const dynamic = "force-dynamic";

export default async function CommunityManagePage() {
  if (!communityLiveEnabled()) notFound();
  await requireAdmin();
  return <CommunityLiveAdmin />;
}
