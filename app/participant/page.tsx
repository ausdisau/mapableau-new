import { ParticipantDashboard } from "@/components/admin-panels/participant/ParticipantDashboard";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { getParticipantDashboard } from "@/lib/participants/participant-service";

export const metadata = { title: "Participant admin | MapAble" };

export default async function ParticipantAdminPage() {
  const user = await requireParticipantPanel();
  const data = await getParticipantDashboard(user);
  return <ParticipantDashboard data={data} />;
}
