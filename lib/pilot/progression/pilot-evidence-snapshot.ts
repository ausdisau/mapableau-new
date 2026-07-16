import { prisma } from "@/lib/prisma";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";

export type PilotEvidenceSnapshot = {
  pilotId: string;
  status: string;
  stage: string;
  enrolledParticipants: number;
  authorisedWorkers: number;
  openSignals: number;
  openCorrectiveActions: number;
  latestReviewOutcome: string | null;
  limitedLiveEnabled: boolean;
  assuranceAssessmentId: string | null;
  goLiveAssessmentId: string | null;
  capturedAt: string;
};

export async function capturePilotEvidenceSnapshot(
  pilotId: string
): Promise<PilotEvidenceSnapshot> {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: pilotId },
  });
  const [enrolledParticipants, authorisedWorkers, openSignals, openCorrectiveActions, latestReview] =
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
      prisma.pilotDailyReview.findFirst({
        where: { pilotId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const snapshot: PilotEvidenceSnapshot = {
    pilotId,
    status: pilot.status,
    stage: pilot.stage,
    enrolledParticipants,
    authorisedWorkers,
    openSignals,
    openCorrectiveActions,
    latestReviewOutcome: latestReview?.outcome ?? null,
    limitedLiveEnabled: pilot.limitedLiveEnabled,
    assuranceAssessmentId: pilot.assuranceAssessmentId,
    goLiveAssessmentId: pilot.goLiveAssessmentId,
    capturedAt: new Date().toISOString(),
  };

  return sanitiseAuditJson(snapshot) as PilotEvidenceSnapshot;
}
