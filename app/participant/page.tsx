import { redirect } from "next/navigation";

import { ParticipantDashboard } from "@/components/participant/ParticipantDashboard";
import { requireAuth } from "@/lib/auth/guards";
import {
  logParticipantDashboardAccess,
  resolveParticipantAccess,
} from "@/lib/participant/participant-access";
import { getParticipantDashboardData } from "@/lib/participant/participant-dashboard-service";

type ParticipantPageProps = {
  searchParams: Promise<{ participantId?: string }>;
};

export default async function ParticipantPage({
  searchParams,
}: ParticipantPageProps) {
  const user = await requireAuth("/login");
  const params = await searchParams;
  const access = await resolveParticipantAccess(user, params.participantId);

  if (!access) {
    redirect("/dashboard");
  }

  await logParticipantDashboardAccess(
    user,
    access.participantId,
    access.viewAsDelegate,
    "overview",
  );

  const data = await getParticipantDashboardData(
    access.participantId,
    access.viewAsDelegate,
  );

  return <ParticipantDashboard data={data} />;
}
