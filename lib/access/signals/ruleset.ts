/**
 * Versioned draft rule registry.
 * Placeholder AS/Premises references are marked draft — no copyrighted tables;
 * cannot claim regulatory compliance.
 */

export const ACCESS_SIGNALS_RULE_VERSION = "signals-draft-0.1.0" as const;

export type DraftRule = {
  id: string;
  domain: string;
  title: string;
  draftReference: string;
  severity: "critical" | "major" | "advisory";
  notes: string;
};

export const DRAFT_RULESET: readonly DraftRule[] = [
  {
    id: "AS-PATH-WIDTH",
    domain: "paths",
    title: "Continuous accessible path width",
    draftReference: "AS draft placeholder — not a compliance claim",
    severity: "critical",
    notes: "Insufficient measured width → unknown or red; never invent clearance.",
  },
  {
    id: "AS-RAMP-GRADE",
    domain: "ramps",
    title: "Ramp running slope",
    draftReference: "Premises Standards draft placeholder",
    severity: "critical",
    notes: "Unverified slope observations cannot yield Green.",
  },
  {
    id: "AS-KERB-RAMP",
    domain: "crossings",
    title: "Kerb ramp presence",
    draftReference: "AS draft placeholder — not a compliance claim",
    severity: "major",
    notes: "Missing kerb ramp is a barrier for the crossing segment.",
  },
  {
    id: "AS-TOILET-ACCESS",
    domain: "amenities",
    title: "Accessible sanitary facility",
    draftReference: "Premises Standards draft placeholder",
    severity: "major",
    notes: "Layer-name heuristics (ADL) must not imply verified Green.",
  },
  {
    id: "AS-SIGNAGE",
    domain: "wayfinding",
    title: "Accessible wayfinding",
    draftReference: "Advisory draft only",
    severity: "advisory",
    notes: "Icon presence ≠ accessibility rating.",
  },
] as const;

export function getDraftRule(id: string): DraftRule | undefined {
  return DRAFT_RULESET.find((rule) => rule.id === id);
}
