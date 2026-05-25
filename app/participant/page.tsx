import { PageContainer } from "@/components/layout/PageContainer";
import { ParticipantDashboard } from "@/components/participant/ParticipantDashboard";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getParticipantDashboardData } from "@/lib/participants/participant-dashboard-service";

export default async function ParticipantDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const data = await getParticipantDashboardData(user.id);

  return (
    <PageContainer title="Home">
      <ParticipantDashboard data={data} />
    </PageContainer>
  );
}
