export type ContentScanResult = {
  shouldQueue: boolean;
  priority: "normal" | "high" | "urgent";
  flags: string[];
};

const CRISIS_PATTERNS = [
  /\b(kill myself|suicide|self[- ]?harm|end my life)\b/i,
  /\b(want to die|hurt myself)\b/i,
];

const ABUSE_PATTERNS = [
  /\b(stupid|idiot|worthless)\b/i,
  /\b(kill you|hurt you)\b/i,
];

const PII_PATTERNS = [
  /\b\d{4}\s?\d{3}\s?\d{3}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b0?4\d{2}\s?\d{3}\s?\d{3}\b/,
];

const MEDICAL_LEGAL_PATTERNS = [
  /\b(you must|guaranteed|legal advice|sue them|ndis will pay)\b/i,
  /\b(diagnos(e|is)|prescri(be|ption)|medication dose)\b/i,
];

const NAMED_ACCUSATION = /\b([A-Z][a-z]+ [A-Z][a-z]+) (is a|stole|abused)\b/;

export function scanPeerContent(text: string): ContentScanResult {
  const flags: string[] = [];
  let priority: ContentScanResult["priority"] = "normal";

  for (const p of CRISIS_PATTERNS) {
    if (p.test(text)) {
      flags.push("self_harm_or_crisis");
      priority = "urgent";
    }
  }
  for (const p of ABUSE_PATTERNS) {
    if (p.test(text)) flags.push("abuse_or_harassment");
  }
  for (const p of PII_PATTERNS) {
    if (p.test(text)) flags.push("privacy_violation");
  }
  for (const p of MEDICAL_LEGAL_PATTERNS) {
    if (p.test(text)) flags.push("medical_or_legal_claim");
  }
  if (NAMED_ACCUSATION.test(text)) flags.push("named_accusation");

  if (flags.includes("abuse_or_harassment") && priority !== "urgent") {
    priority = "high";
  }

  return {
    shouldQueue: flags.length > 0,
    priority,
    flags,
  };
}

export function initialPostStatus(scan: ContentScanResult): "published" | "pending_moderation" {
  return scan.shouldQueue ? "pending_moderation" : "published";
}
