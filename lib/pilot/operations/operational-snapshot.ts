import { prisma } from "@/lib/prisma";

export type OperationalSnapshot = {
  pilotId: string;
  status: string;
  stage: string;
  enrolled: number;
  reservedCents: number;
  committedCents: number;
  openSignals: number;
  openActions: number;
  activeShifts: number;
  capturedAt: string;
};

export async function buildOperationalSnapshot(
  pilotId: string
): Promise<OperationalSnapshot> {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: pilotId },
  });
  const [enrolled, reserved, committed, openSignals, openActions, activeShifts] =
    await Promise.all([
      prisma.pilotParticipantEnrolment.count({
        where: { pilotId, status: "enrolled" },
      }),
      prisma.pilotLimitReservation.aggregate({
        where: { pilotId, status: "reserved" },
        _sum: { amountCents: true },
      }),
      prisma.pilotLimitReservation.aggregate({
        where: { pilotId, status: "committed" },
        _sum: { amountCents: true },
      }),
      prisma.pilotSafetySignal.count({
        where: { pilotId, acknowledged: false },
      }),
      prisma.pilotCorrectiveAction.count({
        where: { pilotId, status: { in: ["open", "in_progress"] } },
      }),
      prisma.pilotOperatorShift.count({
        where: { pilotId, endedAt: null },
      }),
    ]);

  return {
    pilotId,
    status: pilot.status,
    stage: pilot.stage,
    enrolled,
    reservedCents: reserved._sum.amountCents ?? 0,
    committedCents: committed._sum.amountCents ?? 0,
    openSignals,
    openActions,
    activeShifts,
    capturedAt: new Date().toISOString(),
  };
}
