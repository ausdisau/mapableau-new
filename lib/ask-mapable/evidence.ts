/**
 * Evidence and provenance vocabulary for Ask MapAble.
 * Never convey evidence state by colour alone.
 */

export const EVIDENCE_STATES = [
  "KNOWN",
  "UNKNOWN",
  "CONFLICTING",
  "NOT_APPLICABLE",
] as const;

export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const EVIDENCE_PROVENANCE = [
  "participant_confirmed",
  "community_reported",
  "multiple_community_reports",
  "provider_claimed",
  "mapable_verified",
  "mapable_accredited",
  "professional_assessment",
  "ai_inference",
] as const;

export type EvidenceProvenance = (typeof EVIDENCE_PROVENANCE)[number];

export type EvidenceLabel = {
  state: EvidenceState;
  provenance?: EvidenceProvenance;
  summary: string;
};

/** Plain-language label — never upgrades provider claims or AI inference. */
export function formatEvidenceLabel(label: EvidenceLabel): string {
  const stateText = label.state.replaceAll("_", " ");
  if (!label.provenance) {
    return `${stateText}: ${label.summary}`;
  }
  const provenanceText = label.provenance.replaceAll("_", " ");
  return `${stateText} (${provenanceText}): ${label.summary}`;
}

/**
 * Promote never: provider_claimed / ai_inference must not become verified/accredited.
 */
export function assertProvenanceNotInflated(
  claimed: EvidenceProvenance,
  presentedAs: EvidenceProvenance,
): boolean {
  const elevated = new Set<EvidenceProvenance>([
    "mapable_verified",
    "mapable_accredited",
    "professional_assessment",
  ]);
  if (
    (claimed === "provider_claimed" || claimed === "ai_inference") &&
    elevated.has(presentedAs)
  ) {
    return false;
  }
  if (claimed === "ai_inference" && presentedAs === "mapable_accredited") {
    return false;
  }
  return claimed === presentedAs || !elevated.has(presentedAs) || elevated.has(claimed);
}

/** UNKNOWN / missing data must not be phrased as "not accessible". */
export function absenceIsNotInaccessible(state: EvidenceState, answer: string): boolean {
  if (state !== "UNKNOWN") return true;
  const lowered = answer.toLowerCase();
  const bad =
    /\bnot accessible\b/.test(lowered) ||
    /\binaccessible\b/.test(lowered) ||
    /\bfails accessibility\b/.test(lowered);
  return !bad;
}
