import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import { isRecoveryOptionsEnabled } from "@/lib/continuity-os/feature-flags";
import { getRecoveryCase } from "@/lib/continuity-os/recovery/case-service";
import { compareRecoveryOptions } from "@/lib/continuity-os/recovery/options-engine";

type Params = { params: Promise<{ recoveryId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isRecoveryOptionsEnabled(),
      "RECOVERY_OPTIONS_DISABLED"
    );
    if (disabled) return disabled;

    const { recoveryId } = await params;
    const recoveryCase = await getRecoveryCase(recoveryId, user.id);
    const drafts = recoveryCase.options.map((o) => ({
      optionKey: o.optionKey,
      label: o.label,
      description: o.description,
      availabilityState: o.availabilityState as
        | "verified_available"
        | "available_with_conditions"
        | "requires_confirmation"
        | "unknown"
        | "blocked"
        | "human_review_required",
      preservesOriginalGoal: o.preservesOriginalGoal,
      hardRequirementsMet: o.hardRequirementsMet,
      excludedReason: o.excludedReason ?? undefined,
      unknowns: o.unknownsJson as string[],
      disclosure: o.disclosureJson as Record<string, unknown>,
      people: o.peopleJson as string[],
      timing: o.timingJson as Record<string, unknown>,
      cost: o.costJson as {
        knownCostCents?: number | null;
        estimated: boolean;
        whoPays: string;
        fundingUncertainty: string;
        participantApprovalRequired: boolean;
      },
      preferenceMatch: o.preferenceMatchJson as Record<string, boolean | string>,
      evidenceConfidence: o.evidenceConfidence as
        | "unverified"
        | "low"
        | "medium"
        | "high",
      approvalsRequired: o.approvalsRequiredJson as string[],
      fallback: o.fallbackJson as Record<string, unknown>,
      horizon: o.horizon as
        | "immediate"
        | "short_term"
        | "medium_term"
        | "long_term",
    }));

    return Response.json({
      options: recoveryCase.options,
      comparison: compareRecoveryOptions(drafts),
      disclaimer:
        "A proposed replacement is not available until the relevant service confirms it.",
    });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
