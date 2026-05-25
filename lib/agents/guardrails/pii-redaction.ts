const PII_KEYS = [
  "ndis",
  "address",
  "phone",
  "email",
  "dateOfBirth",
  "participantNumber",
  "homeSuburb",
];

export function redactForTelemetry<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const key of Object.keys(out)) {
    if (PII_KEYS.some((p) => key.toLowerCase().includes(p))) {
      out[key as keyof T] = "[REDACTED]" as T[keyof T];
    }
  }
  return out;
}

export function redactText(text: string): string {
  return text
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[email]")
    .replace(/\b04\d{2}\s?\d{3}\s?\d{3}\b/g, "[phone]");
}
