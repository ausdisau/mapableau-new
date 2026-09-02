import { redactSensitiveText } from "@/lib/ai/platform/redaction/sensitive";
import { redactSensitiveContent } from "@/lib/platform/observability/contracts";

/**
 * Control-plane redaction — reuses existing AI + platform redactors.
 * Never create a parallel surveillance or plaintext logging path.
 */

const PARTICIPANT_CONTENT_KEYS = new Set([
  "objective",
  "message",
  "body",
  "content",
  "participantText",
  "participant_text",
  "rawInput",
  "raw_input",
  "transcript",
  "note",
  "notes",
  "preference",
  "preferences",
  "freeText",
  "free_text",
  "prompt",
  "completion",
]);

const PROHIBITED_METRIC_SUBSTRINGS = [
  "participant_score",
  "behaviour_score",
  "compliance_score",
  "engagement_score",
  "personality",
];

export function redactControlPlaneText(input: string): string {
  return redactSensitiveContent(redactSensitiveText(input));
}

/**
 * Strip keys that commonly carry participant free text and redact string values.
 * Keeps machine reason codes and aggregate counters.
 */
export function sanitizeControlPlaneDetail(
  detail: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(detail)) {
    if (PARTICIPANT_CONTENT_KEYS.has(key)) {
      out[key] = "[REDACTED_PARTICIPANT_CONTENT]";
      continue;
    }
    if (typeof value === "string") {
      out[key] = redactControlPlaneText(value).slice(0, 240);
      continue;
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
      continue;
    }
    out[key] = "[OMITTED_NON_SCALAR]";
  }
  return out;
}

export function assertNoProhibitedParticipantMetrics(
  metricNames: string[],
): { ok: true } | { ok: false; offenders: string[] } {
  const offenders = metricNames.filter((name) =>
    PROHIBITED_METRIC_SUBSTRINGS.some((p) =>
      name.toLowerCase().includes(p),
    ),
  );
  if (offenders.length > 0) return { ok: false, offenders };
  return { ok: true };
}

export function containsProhibitedParticipantContent(
  payload: unknown,
): boolean {
  const serialized = JSON.stringify(payload ?? {}).toLowerCase();
  if (serialized.includes("participant_score")) return true;
  if (serialized.includes("behaviour_score")) return true;
  if (serialized.includes("compliance_score")) return true;
  if (
    /"objective"\s*:\s*"[^"]{40,}"/.test(serialized) &&
    !serialized.includes("[redacted")
  ) {
    return true;
  }
  return false;
}
