import type { AccessFitResult } from "@prisma/client";

export function evaluateAccessibilityFit(input: {
  hardConstraintFailures: string[];
  preferenceMisses: string[];
  staleWarnings: string[];
}): AccessFitResult {
  if (input.hardConstraintFailures.length > 0) return "incompatible";
  if (input.staleWarnings.length > 0) return "uncertain";
  if (input.preferenceMisses.length > 0) return "requires_confirmation";
  return "compatible";
}
