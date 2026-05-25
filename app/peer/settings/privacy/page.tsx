import Link from "next/link";

import { PeerPrivacySettingsPanel } from "@/components/peer";
import { getActivePeerProfileForUser } from "@/lib/peer/access-control";
import { requireAuth } from "@/lib/auth/guards";

export default async function PeerPrivacySettingsPage() {
  const user = await requireAuth();
  const profile = await getActivePeerProfileForUser(user.id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer privacy</h1>
      <PeerPrivacySettingsPanel
        initialPause={profile?.privacySettings?.pauseCommunityNotifications ?? false}
        initialLockScreenSafe={profile?.privacySettings?.lockScreenSafeOnly ?? true}
      />
      <Link href="/peer" className="text-sm underline">
        Back
      </Link>
    </div>
  );
}
