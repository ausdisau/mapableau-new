import { CoordinateHomeClient } from "@/components/coordinate/CoordinateHomeClient";
import { requireAuth } from "@/lib/auth/guards";
import { resolveRoleView, isCoordinatorRole } from "@/lib/coordinate/access-service";
import {
  getCoordinateDashboard,
  listCoordinatorParticipantsForDashboard,
} from "@/lib/coordinate/plan-service";
import { listCoordinatorParticipants } from "@/lib/support-coordinator/relationship-service";

export default async function CoordinateHomePage({
  searchParams,
}: {
  searchParams: Promise<{ participantId?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const roleView = resolveRoleView(user.primaryRole);

  const dashboard = await getCoordinateDashboard({
    actorId: user.id,
    actorRole: user.primaryRole,
    participantId: params.participantId,
  });

  const coordinatorParticipants = isCoordinatorRole(user.primaryRole)
    ? await listCoordinatorParticipantsForDashboard(user.id)
    : [];

  const rels = isCoordinatorRole(user.primaryRole)
    ? await listCoordinatorParticipants(user.id)
    : [];

  const participantOptions = rels.map((rel) => ({
    participantId: rel.participantId,
    participantName: rel.displayName ?? rel.participantId,
  }));

  return (
    <CoordinateHomeClient
      dashboard={dashboard}
      coordinatorParticipants={coordinatorParticipants}
      roleView={roleView}
      participantOptions={participantOptions}
    />
  );
}
