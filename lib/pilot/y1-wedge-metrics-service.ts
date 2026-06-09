import { prisma } from "@/lib/prisma";
import { getBackupRecoveryPilotMetrics } from "@/lib/care/backup-recovery-pilot";
import { isY1WedgePilotActive } from "@/lib/pilot/y1-wedge-pilot";

export type Y1WedgePilotMetrics = {
  pilotActive: boolean;
  periodDays: number;
  continuityAdjustedSupportedWeeks: number;
  matchDisputeRate: number;
  backupRecoverySuccessRate: number;
  supportProfilesPublished: number;
  matchConfirmations: number;
  matchDisputes: number;
  backupRecovery: Awaited<ReturnType<typeof getBackupRecoveryPilotMetrics>>;
};

export async function collectY1WedgePilotMetrics(
  periodDays = 30
): Promise<Y1WedgePilotMetrics> {
  const since = new Date(Date.now() - periodDays * 86400000);

  const [supportProfilesPublished, matchDecisions, backupRecovery] =
    await Promise.all([
      prisma.supportProfile.count({
        where: { publishedAt: { not: null, gte: since } },
      }),
      prisma.matchDecision.findMany({
        where: { createdAt: { gte: since } },
        select: { participantConfirmed: true, decision: true, notes: true },
      }),
      getBackupRecoveryPilotMetrics(),
    ]);

  const matchConfirmations = matchDecisions.filter(
    (d) => d.participantConfirmed
  ).length;
  const matchDisputes = matchDecisions.filter(
    (d) =>
      d.decision === "disputed" ||
      (d.notes != null && d.notes.toLowerCase().includes("dispute"))
  ).length;
  const matchDisputeRate =
    matchConfirmations > 0 ? matchDisputes / matchConfirmations : 0;

  const approvedShifts = await prisma.careShift.count({
    where: { status: "approved", startAt: { gte: since } },
  });
  const seriousMisfits = backupRecovery.seriousMisfitCount;
  const continuityAdjustedSupportedWeeks = Math.max(
    0,
    Math.floor(approvedShifts / 7) - seriousMisfits
  );

  return {
    pilotActive: isY1WedgePilotActive(),
    periodDays,
    continuityAdjustedSupportedWeeks,
    matchDisputeRate,
    backupRecoverySuccessRate: backupRecovery.assignmentRate,
    supportProfilesPublished,
    matchConfirmations,
    matchDisputes,
    backupRecovery,
  };
}
