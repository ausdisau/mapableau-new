/**
 * Plain-language rendering helpers. Every AURA-facing surface presented to a
 * participant must include the mandatory disclaimers and MUST NOT claim
 * consciousness, legal authority, or medical judgment.
 */

export const MANDATORY_DISCLAIMERS = {
  notSentient:
    "AURA is not sentient and does not experience feelings — it is a bounded software agent.",
  notLegalAuthority:
    "AURA is not your legal representative. It cannot sign anything on your behalf.",
  notMedical:
    "AURA is not a medical practitioner and cannot give medical advice.",
  humanInLoop:
    "A person still confirms the actions that affect your services, money, or safety.",
  boundedAuthority:
    "AURA only acts within the boundaries you set — you can pause it at any time.",
} as const;

export type MandatoryDisclaimerKey = keyof typeof MANDATORY_DISCLAIMERS;

export const REQUIRED_DISCLAIMER_KEYS: MandatoryDisclaimerKey[] = [
  "notSentient",
  "notLegalAuthority",
  "humanInLoop",
];

export function assertDisclaimersPresent(text: string): boolean {
  const lowered = text.toLowerCase();
  return REQUIRED_DISCLAIMER_KEYS.every((key) =>
    lowered.includes(MANDATORY_DISCLAIMERS[key].toLowerCase().slice(0, 20))
  );
}

/**
 * Guard against sensational language. AURA docs, prompts, and manifests must
 * not describe the agent as sentient, conscious, alive, or as an AGI.
 */
export const FORBIDDEN_SELF_DESCRIPTIONS = [
  "sentient",
  "conscious",
  "self-aware",
  "self aware",
  "artificial general intelligence",
  "agi",
  "alive",
  "has feelings",
  "has emotions",
  "understands you fully",
  "replaces your doctor",
  "replaces your lawyer",
  "replaces your planner",
];

export function containsForbiddenSelfDescription(
  text: string
): { forbidden: true; matches: string[] } | { forbidden: false } {
  const lowered = text.toLowerCase();
  const matches: string[] = [];
  for (const bad of FORBIDDEN_SELF_DESCRIPTIONS) {
    if (lowered.includes(bad)) matches.push(bad);
  }
  if (matches.length > 0) return { forbidden: true, matches };
  return { forbidden: false };
}
