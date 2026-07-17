import { buildAuditorPilotReport } from "@/lib/pilot/reporting/auditor-report";
import { buildBoardPilotReport } from "@/lib/pilot/reporting/board-report";
import { buildPilotClosureReport } from "@/lib/pilot/reporting/closure-report";
import { buildParticipantPilotReport } from "@/lib/pilot/reporting/participant-report";
import { buildRegulatorEvidencePack } from "@/lib/pilot/reporting/regulator-evidence-pack";
import { prisma } from "@/lib/prisma";

export async function generatePilotReports(pilotId: string) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: pilotId },
  });
  const [
    enrolled,
    committed,
    openSignals,
    latestReview,
    decisions,
    reservations,
    incidents,
    complaints,
    exited,
  ] = await Promise.all([
    prisma.pilotParticipantEnrolment.count({
      where: { pilotId, status: "enrolled" },
    }),
    prisma.pilotLimitReservation.aggregate({
      where: { pilotId, status: "committed" },
      _sum: { amountCents: true },
    }),
    prisma.pilotSafetySignal.count({
      where: { pilotId, acknowledged: false },
    }),
    prisma.pilotDailyReview.findFirst({
      where: { pilotId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pilotDecisionRecord.findMany({
      where: { pilotId },
      select: { id: true },
    }),
    prisma.pilotLimitReservation.count({ where: { pilotId } }),
    prisma.incidentReport.findMany({
      where: { pilotId },
      select: { id: true },
    }),
    prisma.complaint.count({ where: { pilotId } }),
    prisma.pilotParticipantEnrolment.count({
      where: { pilotId, status: { in: ["exited", "withdrawn"] } },
    }),
  ]);

  return {
    board: buildBoardPilotReport({
      pilotName: pilot.name,
      status: pilot.status,
      stage: pilot.stage,
      enrolled,
      committedCents: committed._sum.amountCents ?? 0,
      openSignals,
      reviewOutcome: latestReview?.outcome ?? null,
    }),
    auditor: buildAuditorPilotReport({
      pilotId,
      decisionCount: decisions.length,
      reservationCount: reservations,
      incidentCount: incidents.length,
      complaintCount: complaints,
    }),
    regulator: buildRegulatorEvidencePack({
      pilotId,
      assuranceAssessmentId: pilot.assuranceAssessmentId,
      goLiveAssessmentId: pilot.goLiveAssessmentId,
      decisionIds: decisions.map((d) => d.id),
      incidentIds: incidents.map((i) => i.id),
    }),
    closure: buildPilotClosureReport({
      pilotId,
      name: pilot.name,
      lessons: [],
      finalCommittedCents: committed._sum.amountCents ?? 0,
      participantsExited: exited,
    }),
    participantTemplate: buildParticipantPilotReport({
      pilotName: pilot.name,
      enrolmentStatus: "unknown",
      hasPilotConsent: false,
    }),
  };
}
