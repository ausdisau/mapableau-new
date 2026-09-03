import { z } from "zod";

import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";

/**
 * Outcomes for environmental compatibility checks.
 * Never "safe" / "unsafe" — compares known facts with user requirements.
 */
export const COMPATIBILITY_RESULTS = [
  "COMPATIBLE_WITH_KNOWN_FACTS",
  "POTENTIAL_DIFFICULTY",
  "KNOWN_CONFLICT",
  "UNKNOWN",
  "REQUIRES_MORE_INFORMATION",
] as const;

export type CompatibilityResult = (typeof COMPATIBILITY_RESULTS)[number];

/** User-configured requirements / preferences — not clinical operating limits. */
export type AccessRequirements = {
  minimumWidthMm?: number;
  maximumPreferredGradientPercent?: number;
  maximumPreferredCrossSlopePercent?: number;
  maximumPreferredThresholdMm?: number;
  requiresStepFree?: boolean;
  requiresLift?: boolean;
  preferredSurfaces?: string[];
  avoidedSurfaces?: string[];
};

export const accessRequirementsSchema = z.object({
  minimumWidthMm: z.number().int().positive().optional(),
  maximumPreferredGradientPercent: z.number().min(0).max(30).optional(),
  maximumPreferredCrossSlopePercent: z.number().min(0).max(15).optional(),
  maximumPreferredThresholdMm: z.number().int().min(0).optional(),
  requiresStepFree: z.boolean().optional(),
  requiresLift: z.boolean().optional(),
  preferredSurfaces: z.array(z.string()).optional(),
  avoidedSurfaces: z.array(z.string()).optional(),
});

export type CompatibilityRuleEvaluation = {
  requirement: string;
  observedValue: string | number | boolean | null;
  result: CompatibilityResult;
  evidence: GaisEvidenceRef[] | null;
  explanation: string;
};

export type CompatibilityEvaluation = {
  overall: CompatibilityResult;
  rules: CompatibilityRuleEvaluation[];
  unknowns: string[];
  matches: CompatibilityRuleEvaluation[];
  difficulties: CompatibilityRuleEvaluation[];
  conflicts: CompatibilityRuleEvaluation[];
};

export const COMPATIBILITY_RESULT_LABELS: Record<CompatibilityResult, string> = {
  COMPATIBLE_WITH_KNOWN_FACTS: "Compatible with known facts",
  POTENTIAL_DIFFICULTY: "Potential difficulty",
  KNOWN_CONFLICT: "Known conflict with requirements",
  UNKNOWN: "Unknown — insufficient environmental data",
  REQUIRES_MORE_INFORMATION: "Requires more information",
};
