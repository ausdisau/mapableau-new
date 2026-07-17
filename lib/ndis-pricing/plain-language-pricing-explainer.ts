import type { PricingWarning } from "@/types/ndis-pricing";

export type ExplanationAudience = "participant" | "provider" | "admin";

export function explainWarning(
  warning: PricingWarning,
  audience: ExplanationAudience
): string {
  if (audience === "participant") {
    return (
      warning.plainMessage ??
      plainParticipantMessage(warning.code, warning.message)
    );
  }
  if (audience === "admin") {
    return warning.technicalMessage ?? `[${warning.code}] ${warning.message}`;
  }
  return warning.technicalMessage ?? warning.message;
}

function plainParticipantMessage(code: string, fallback: string): string {
  const map: Record<string, string> = {
    price_exceeds_catalogue_cap:
      "This line may be priced above the guide limit in our system. Your plan manager or provider should check it before claiming.",
    missing_catalogue_price:
      "We could not find a price for this support item in our catalogue. Someone will need to check the amount manually.",
    low_match_confidence:
      "We are not sure this is the right support item. Please ask your provider to confirm.",
    missing_support_item_code:
      "This line does not list an NDIS support item number yet. Your provider may need to add one.",
    ndis_claim_requires_code:
      "This line is marked for NDIS but does not have a support item number. Your provider should review it.",
  };
  return map[code] ?? fallback;
}

export function buildValidationSummary(
  warningsCount: number,
  errorsCount: number,
  audience: ExplanationAudience
): string {
  if (audience === "participant") {
    if (errorsCount > 0) {
      return `We found ${errorsCount} issue(s) that need a provider or plan manager to fix. This is not a decision about your NDIS funding.`;
    }
    if (warningsCount > 0) {
      return `We found ${warningsCount} reminder(s) to double-check. This does not mean your claim was sent to the NDIA.`;
    }
    return "No issues were flagged against our price catalogue. Your provider still confirms amounts before any claim.";
  }
  return `Pre-check complete: ${errorsCount} error(s), ${warningsCount} warning(s). Not submitted to NDIA.`;
}

export function enrichWarningsForAudience(
  warnings: PricingWarning[],
  audience: ExplanationAudience
): PricingWarning[] {
  return warnings.map((w) => ({
    ...w,
    plainMessage: explainWarning(w, audience),
    technicalMessage:
      w.technicalMessage ?? `[${w.severity}] ${w.code}: ${w.message}`,
  }));
}
