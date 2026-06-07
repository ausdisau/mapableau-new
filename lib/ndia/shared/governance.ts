import { phase5Config } from "@/lib/config/phase5";
import { phase7Config } from "@/lib/config/phase7";
import { getNdiaHttpConfig, isNdiaLiveSubmitAllowed } from "@/lib/ndia/shared/config";
import { prisma } from "@/lib/prisma";

export class NdiaGovernanceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "GOVERNANCE_APPROVAL_REQUIRED"
      | "NDIA_PILOT_DISABLED"
      | "REAL_SUBMISSION_REQUIRES_PILOT"
  ) {
    super(message);
    this.name = "NdiaGovernanceError";
  }
}

/**
 * Enforces human approval and pilot flags before any NDIA submit (mock or live).
 */
export async function assertNdiaSubmitGovernance(): Promise<void> {
  const config = getNdiaHttpConfig();
  const live = isNdiaLiveSubmitAllowed();

  if (live) {
    if (!phase7Config.ndiaPilotEnabled) {
      throw new NdiaGovernanceError(
        "NDIA pilot must be enabled before live submission",
        "NDIA_PILOT_DISABLED"
      );
    }
    if (!phase5Config.ndiaRealSubmissionEnabled) {
      throw new NdiaGovernanceError(
        "NDIA_REAL_SUBMISSION_ENABLED must be true for live submit",
        "REAL_SUBMISSION_REQUIRES_PILOT"
      );
    }
  }

  if (config.requireHumanApproval) {
    const approval = await prisma.ndiaPilotApprovalRecord.findFirst({
      where: { approved: true },
      orderBy: { approvedAt: "desc" },
    });
    if (!approval) {
      throw new NdiaGovernanceError(
        "Governance approval required before NDIA submit",
        "GOVERNANCE_APPROVAL_REQUIRED"
      );
    }
  }
}
