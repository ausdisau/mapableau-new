import {
  ServiceArrangementFieldSchema,
  type ServiceArrangement,
  type ServiceArrangementField,
  type ServiceChangeDiff,
} from "./types";

const FIELD_ORDER = ServiceArrangementFieldSchema.options;

function isUnknown(value: string | null | undefined): boolean {
  if (value == null) return false;
  const normalised = value.trim().toLowerCase();
  return normalised === "" || normalised === "unknown" || normalised === "?";
}

function isMissing(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

function impactFor(
  changed: ServiceArrangementField[],
  newlyMissing: ServiceArrangementField[],
  newUnknowns: ServiceArrangementField[],
): ServiceChangeDiff["impact"] {
  const touched = new Set([...changed, ...newlyMissing, ...newUnknowns]);
  const mark = (keys: ServiceArrangementField[]) => {
    if (keys.some((k) => newUnknowns.includes(k) || newlyMissing.includes(k))) {
      return "unknown" as const;
    }
    if (keys.some((k) => touched.has(k))) return "changed" as const;
    return "none" as const;
  };

  return {
    access: mark(["venue", "entrance", "route", "equipment", "vehicle"]),
    communication: mark(["communication_acknowledgement", "worker", "provider"]),
    price: mark(["price", "funding_route", "agreement"]),
    timing: mark(["support_time", "route"]),
    evidence: mark(["agreement", "communication_acknowledgement", "equipment"]),
  };
}

/**
 * Deterministic, text-first arrangement comparison.
 * Free of model-generated authoritative conclusions.
 */
export function buildServiceChangeDiff(
  prior: ServiceArrangement,
  proposed: ServiceArrangement,
): ServiceChangeDiff {
  const unchanged: ServiceArrangementField[] = [];
  const changed: ServiceChangeDiff["changed"] = [];
  const newlyMissing: ServiceArrangementField[] = [];
  const newUnknowns: ServiceArrangementField[] = [];

  for (const field of FIELD_ORDER) {
    const from = prior.fields[field] ?? null;
    const to = proposed.fields[field] ?? null;

    if (from === to) {
      unchanged.push(field);
      continue;
    }

    changed.push({ field, from, to });

    if (!isMissing(from) && isMissing(to)) {
      newlyMissing.push(field);
    }
    if (!isUnknown(from) && isUnknown(to)) {
      newUnknowns.push(field);
    }
  }

  const impact = impactFor(
    changed.map((c) => c.field),
    newlyMissing,
    newUnknowns,
  );

  const participantActionRequired =
    changed.length > 0 || newlyMissing.length > 0 || newUnknowns.length > 0;

  return {
    prior,
    proposed,
    unchanged,
    changed,
    newlyMissing,
    newUnknowns,
    impact,
    participantActionRequired,
    authoritativeConclusions: false,
  };
}

/** Stable text rendering for accessible review (list-first). */
export function renderServiceChangeDiffText(diff: ServiceChangeDiff): string {
  const lines: string[] = [
    "What changed — participant review",
    "",
    "Changed:",
  ];

  if (diff.changed.length === 0) {
    lines.push("- (none)");
  } else {
    for (const item of diff.changed) {
      lines.push(`- ${item.field}: ${item.from ?? "(empty)"} → ${item.to ?? "(empty)"}`);
    }
  }

  lines.push("", "Unchanged:");
  for (const field of diff.unchanged) {
    lines.push(`- ${field}`);
  }

  lines.push("", "Newly missing:");
  lines.push(
    diff.newlyMissing.length
      ? diff.newlyMissing.map((f) => `- ${f}`).join("\n")
      : "- (none)",
  );

  lines.push("", "New unknowns:");
  lines.push(
    diff.newUnknowns.length
      ? diff.newUnknowns.map((f) => `- ${f}`).join("\n")
      : "- (none)",
  );

  lines.push(
    "",
    `Participant action required: ${diff.participantActionRequired ? "yes" : "no"}`,
    "Authoritative conclusions: none (deterministic comparison only)",
  );

  return lines.join("\n");
}
