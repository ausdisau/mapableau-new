import Link from "next/link";

import { AccessNeedsSummary } from "@/components/admin-panels/participant/AccessNeedsSummary";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { getParticipantDashboard } from "@/lib/participants/participant-service";

export const metadata = { title: "Profile | Participant admin" };

export default async function ParticipantProfilePage() {
  const user = await requireParticipantPanel();
  const data = await getParticipantDashboard(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Profile</h1>
      <AccessNeedsSummary accessibility={data.accessibility} profile={data.profile} />
      <Link href="/dashboard/profile/edit" className="text-sm text-primary hover:underline">
        Edit full profile in core dashboard →
      </Link>
    </div>
  );
}
