import { prisma } from "@/lib/prisma";

export class ExecutiveDecisionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ExecutiveDecisionError";
  }
}

const MIN_DECISION_TEXT_LENGTH = 40;

/**
 * Record an executive's GA decision. AI actors are refused by design — the
 * executive user must exist in `User` and be human.
 */
export async function recordExecutiveGaDecision(input: {
  assessmentId: string;
  executiveUserId: string;
  decision: "approved" | "withdrawn";
  decisionText: string;
}) {
  if (!input.executiveUserId) {
    throw new ExecutiveDecisionError("EXECUTIVE_USER_REQUIRED");
  }
  if (
    !input.decisionText ||
    input.decisionText.trim().length < MIN_DECISION_TEXT_LENGTH
  ) {
    throw new ExecutiveDecisionError("EXECUTIVE_DECISION_TEXT_TOO_SHORT");
  }
  const executive = await prisma.user.findUnique({
    where: { id: input.executiveUserId },
    select: { id: true },
  });
  if (!executive) {
    throw new ExecutiveDecisionError("EXECUTIVE_USER_NOT_FOUND");
  }
  return prisma.generalAvailabilityAssessment.update({
    where: { id: input.assessmentId },
    data: {
      decision: input.decision,
      executiveUserId: input.executiveUserId,
      executiveDecisionAt: new Date(),
      executiveDecisionText: input.decisionText,
      advisoryOnly: false,
    },
  });
}
