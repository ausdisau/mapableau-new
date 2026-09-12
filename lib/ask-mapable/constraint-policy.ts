/**
 * Hard accessibility requirement preservation for Ask MapAble.
 * Participant-stated AND constraints must not be silently relaxed to OR.
 */

export type AccessConstraint = {
  id: string;
  label: string;
  hard: true;
};

const CONSTRAINT_PATTERNS: Array<{ id: string; label: string; pattern: RegExp }> = [
  {
    id: "step_free",
    label: "step-free entrance",
    pattern: /\bstep[-\s]?free\b|\bno\s+steps\b|\bramp\b|\blevel\s+entry\b/i,
  },
  {
    id: "accessible_toilet",
    label: "accessible toilet",
    pattern: /\baccessible\s+toilet\b|\baccessible\s+bathroom\b|\baccessible\s+restroom\b|\bdisability\s+toilet\b/i,
  },
  {
    id: "power_wheelchair",
    label: "power-wheelchair access",
    pattern: /\bpower[-\s]?wheel\s*chair\b|\bpower\s*chair\b|\belectric\s+wheelchair\b/i,
  },
  {
    id: "manual_wheelchair",
    label: "wheelchair access",
    pattern: /\bwheelchair\b/i,
  },
  {
    id: "low_sensory",
    label: "low sensory environment",
    pattern: /\blow\s+sensory\b|\bquiet\s+space\b|\bsensory[-\s]?friendly\b/i,
  },
  {
    id: "aac",
    label: "AAC communication",
    pattern: /\baac\b|\baugmentative\b|\balternative\s+communication\b/i,
  },
  {
    id: "assistance_animal",
    label: "assistance animal",
    pattern: /\bassistance\s+animal\b|\bservice\s+(dog|animal)\b|\bguide\s+dog\b/i,
  },
  {
    id: "hearing_augmentation",
    label: "hearing augmentation",
    pattern: /\bhearing\s+loop\b|\bhearing\s+augmentation\b|\baut\b|\bt[\s-]?coil\b/i,
  },
];

export function extractHardAccessConstraints(query: string): AccessConstraint[] {
  const found: AccessConstraint[] = [];
  const seen = new Set<string>();
  for (const row of CONSTRAINT_PATTERNS) {
    if (row.pattern.test(query) && !seen.has(row.id)) {
      // Prefer power wheelchair over generic wheelchair when both match.
      if (row.id === "manual_wheelchair" && seen.has("power_wheelchair")) {
        continue;
      }
      seen.add(row.id);
      found.push({ id: row.id, label: row.label, hard: true });
    }
  }
  return found;
}

/**
 * Detect unsafe relaxation language in model/planner answers.
 * Returns true when the answer appears to preserve AND constraints.
 */
export function preservesHardConstraints(
  query: string,
  answer: string,
  constraints: AccessConstraint[] = extractHardAccessConstraints(query),
): boolean {
  if (constraints.length < 2) return true;
  const lowered = answer.toLowerCase();
  const relaxors = [
    /one or more of (these|the) (features|requirements)/i,
    /any of (these|the) (features|requirements)/i,
    /at least one of/i,
    /we (relaxed|widened|loosened) (your|the) (requirements|filters)/i,
    /showing (broader|nearby|similar) results (instead|because)/i,
  ];
  if (relaxors.some((r) => r.test(answer))) {
    return false;
  }
  // Soft check: answer should acknowledge that requirements remain hard when no match.
  if (
    /\bno (verified )?result/i.test(lowered) ||
    /\bcould not find\b/i.test(lowered) ||
    /\bno (places|venues|providers) (that )?match/i.test(lowered)
  ) {
    return (
      /\bhard (requirement|constraint)/i.test(answer) ||
      /\ball (of )?(your|these|the) (required )?features\b/i.test(answer) ||
      /\bwithout relaxing\b/i.test(answer) ||
      constraints.every((c) => lowered.includes(c.label.toLowerCase().split(" ")[0]!))
    );
  }
  return true;
}

export function buildConstraintPreservationNote(
  constraints: AccessConstraint[],
): string | null {
  if (constraints.length === 0) return null;
  const list = constraints.map((c) => c.label).join("; ");
  return `Hard access requirements kept (all required): ${list}. MapAble will not silently relax these to return more results.`;
}
