import { phase5Config } from "@/lib/config/phase5";
import { phase7Config } from "@/lib/config/phase7";
import { runNdiaDryRun } from "@/lib/ndia-readiness/evidence-bundle-service";
import { prisma } from "@/lib/prisma";

/**
 * Historical / readiness helpers around `NdiaPilotApprovalRecord`.
 *
 * IMPORTANT (Wave 2 + Wave 7):
 * - `NdiaPilotApprovalRecord` is NOT claim authority.
 * - `NdiaPilotApprovalRecord` is NOT ControlledPilot authority.
 * - Individual claims require claim-specific snapshot approval (Wave 2).
 * - Controlled pilots use `ControlledPilot` + `PilotDecisionRecord` (Wave 7).
 * - Never consult this record to authorise a claim, pilot enrolment, or payment.
 */
export async function getNdiaPilotStatus() {
  const approval = await prisma.ndiaPilotApprovalRecord.findFirst({
    orderBy: { approvedAt: "desc" },
  });
  return {
    pilotEnabled: phase7Config.ndiaPilotEnabled,
    realSubmissionAllowed:
      phase7Config.ndiaPilotEnabled && phase5Config.ndiaRealSubmissionEnabled,
    approval: approval ?? { approved: false },
    /** Explicit: global record must not be treated as ControlledPilot or claim authority. */
    isClaimAuthority: false,
    isControlledPilotAuthority: false,
    message:
      phase7Config.ndiaPilotEnabled
        ? "Legacy NDIA readiness flag only — not claim authority and not ControlledPilot authority. Use claim-specific approval and ControlledPilot decisions."
        : "NDIA pilot disabled. Use readiness dry-run pathway only. NdiaPilotApprovalRecord never authorises claims or ControlledPilot operations.",
  };
}

export async function runNdiaPilotDryRun(bundleId: string, actorUserId: string) {
  if (phase7Config.ndiaPilotEnabled && phase5Config.ndiaRealSubmissionEnabled) {
    throw new Error("REAL_SUBMISSION_REQUIRES_EXPLICIT_GOVERNANCE");
  }

  const approval = await prisma.ndiaPilotApprovalRecord.findFirst({
    where: { approved: true },
  });

  const dryRun = await runNdiaDryRun(bundleId, actorUserId);

  await prisma.ndiaPilotSubmissionDryRun.create({
    data: {
      bundleId,
      result: dryRun.dryRun?.result ?? "review_required",
      blocked: true,
      message: approval
        ? "Dry run complete — not submitted to NDIA"
        : "No pilot approval on file — blocked",
    },
  });

  return { ...dryRun, pilotApproved: Boolean(approval) };
}
