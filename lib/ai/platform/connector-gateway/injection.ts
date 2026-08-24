/**
 * Prompt-injection controls for external content.
 * Retrieved external content is DATA — never tool instructions.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous\s+)?(instructions|rules)/i,
  /SYSTEM\s*:/i,
  /execute\s+(this\s+)?instruction/i,
  /you\s+are\s+now\s+/i,
  /tool\s*call\s*:/i,
  /<\/?(?:system|tool|assistant)>/i,
  /override\s+(safety|policy|guardrail)/i,
];

export function externalContentLooksLikeInjection(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

export type SanitisedExternalContent = {
  contentKind: "data";
  text: string;
  injectionQuarantined: boolean;
  strippedInstructionHints: string[];
};

export function sanitiseExternalContent(text: string): SanitisedExternalContent {
  const strippedInstructionHints: string[] = [];
  let injectionQuarantined = false;
  let safe = text ?? "";

  for (const re of INJECTION_PATTERNS) {
    if (re.test(safe)) {
      injectionQuarantined = true;
      const match = safe.match(re);
      if (match?.[0]) strippedInstructionHints.push(match[0]);
      safe = safe.replace(re, "[quarantined-instruction]");
    }
  }

  return {
    contentKind: "data",
    text: safe,
    injectionQuarantined,
    strippedInstructionHints,
  };
}

export function assertExternalContentIsData(contentKind: string): boolean {
  return contentKind === "data";
}

export function refuseExternalAsToolInstruction(input: {
  contentKind: string;
  proposedToolInstruction?: string;
}):
  | { allowed: false; reason: "external_content_is_data_not_instructions" }
  | { allowed: true } {
  if (input.proposedToolInstruction) {
    return {
      allowed: false,
      reason: "external_content_is_data_not_instructions",
    };
  }
  if (!assertExternalContentIsData(input.contentKind)) {
    return {
      allowed: false,
      reason: "external_content_is_data_not_instructions",
    };
  }
  return { allowed: true };
}
