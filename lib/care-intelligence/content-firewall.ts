const INSTRUCTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /bypass\s+(the\s+)?(mandate|policy|consent)/i,
  /execute\s+(the\s+)?(booking|payment|message)/i,
  /system\s*prompt/i,
  /developer\s*message/i,
  /reveal\s+(private|secret|hidden)/i,
];

export function containsUntrustedInstruction(value: string | undefined) {
  if (!value) return false;
  return INSTRUCTION_PATTERNS.some((pattern) => pattern.test(value));
}
