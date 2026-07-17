import { evaluateGoLiveDecision } from "@/lib/assurance/go-live/decision-policy";
import type { GoLivePolicyInput } from "@/lib/assurance/go-live/decision-policy";

export function passGoLiveReadinessGate(input: GoLivePolicyInput): boolean {
  const result = evaluateGoLiveDecision(input);
  return (
    result.decision === "approved_for_pilot" ||
    result.decision === "approved_for_production"
  );
}
