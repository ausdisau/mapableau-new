import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  toSafePilotSummary,
} from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId] */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const [enrolmentCount, activeWorkers, openSignals, openActions] =
    await Promise.all([
      prisma.pilotParticipantEnrolment.count({
        where: { pilotId, status: "enrolled" },
      }),
      prisma.pilotWorkerAuthorisation.count({
        where: { pilotId, active: true },
      }),
      prisma.pilotSafetySignal.count({
        where: { pilotId, acknowledged: false },
      }),
      prisma.pilotCorrectiveAction.count({
        where: { pilotId, status: { in: ["open", "in_progress"] } },
      }),
    ]);

  return jsonNdisOk({
    pilot: toSafePilotSummary(pilot),
    summary: {
      enrolledParticipants: enrolmentCount,
      activeWorkers,
      openSignals,
      openCorrectiveActions: openActions,
      emptyAllowlistsDeny:
        pilot.supportItemAllowlist.length === 0 ||
        pilot.fundingRouteAllowlist.length === 0,
      limitedLiveDefaultOff: !pilot.limitedLiveEnabled,
      pilotApprovalIsNotProductionApproval: true,
      noRealNdiaSubmission: true,
    },
  });
}
