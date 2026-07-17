const REDACTED = "[REDACTED]";

const SECRET_KEY_PARTS = [
  "apiKey",
  "apikey",
  "secret",
  "token",
  "password",
  "credential",
  "privateKey",
  "webhook",
  "signature",
];

const PUBLIC_SAFETY_KEY_PARTS = [
  "prompt",
  "chainOfThought",
  "participant",
  "subjectUser",
  "fraudThreshold",
  "riskThreshold",
  "exploit",
  "attack",
  "vulnerability",
  "bypass",
  "payload",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keyNeedsRedaction(key: string): boolean {
  const normalised = key.replace(/[_-\s]/g, "").toLowerCase();
  return [...SECRET_KEY_PARTS, ...PUBLIC_SAFETY_KEY_PARTS].some((part) =>
    normalised.includes(part.toLowerCase()),
  );
}

export function redactPublicRegisterPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactPublicRegisterPayload(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      keyNeedsRedaction(key) ? REDACTED : redactPublicRegisterPayload(child),
    ]),
  );
}

export function redactTextForPublication(text: string): string {
  return text
    .replace(
      /(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi,
      "$1: [REDACTED]",
    )
    .replace(/prompt\s*[:=][^\n]+/gi, "prompt: [REDACTED]")
    .replace(/fraud\s+threshold\s*[:=][^\n]+/gi, "fraud threshold: [REDACTED]");
}
