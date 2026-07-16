/**
 * @mapable/access-fit — personal-fit types for partner SDK.
 * Runtime scoring remains server-side deterministic; clients receive results only.
 */

export type FitStatus =
  | "suitable"
  | "suitable_with_conditions"
  | "not_suitable"
  | "unknown"
  | "blocked";

export type PersonalFitResult = {
  status: FitStatus;
  blockers: string[];
  conditions: string[];
  unknowns: string[];
  confidenceLabel: string;
};

export type AccessRequirementInput = {
  featureType: string;
  importance: "required" | "preferred";
  operator: "available" | "minimum" | "maximum" | "equals";
  value: boolean | number | string;
  unit?: string;
};
