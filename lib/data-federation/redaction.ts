/**
 * Redaction rules applied at disclosure time. The gateway takes a candidate
 * payload and the participant's privacy policy, then produces the outbound
 * payload plus a list of redacted fields.
 */

const DENY_ALWAYS = new Set([
  "password",
  "passwordHash",
  "ndisNumber",
  "medicareNumber",
  "governmentIdentifier",
  "keyMaterial",
  "privateKey",
  "recoverySeed",
]);

const CONDITIONAL_DENY = new Set([
  "email",
  "phone",
  "dateOfBirth",
  "residentialAddress",
  "financialDetails",
  "billingDetails",
  "medicalDetails",
]);

export interface RedactionResult {
  outbound: Record<string, unknown>;
  redactedKeys: string[];
}

export function applyRedaction(
  payload: Record<string, unknown>,
  policy: "minimum_necessary" | "strict" | "open"
): RedactionResult {
  const outbound: Record<string, unknown> = {};
  const redactedKeys: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (DENY_ALWAYS.has(key)) {
      redactedKeys.push(key);
      continue;
    }
    if (policy === "strict" && CONDITIONAL_DENY.has(key)) {
      redactedKeys.push(key);
      continue;
    }
    outbound[key] = value;
  }
  return { outbound, redactedKeys };
}
