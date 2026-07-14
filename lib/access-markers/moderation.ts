import type { AccessMarkerModerationFlags } from "@/lib/access-markers/types";

const PHONE_RE = /\b(\+?\d[\d\s-]{7,}\d)\b/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const LEGAL_CLAIM_RE =
  /\b(illegally\s+discriminat\w*|dda\s+certified|fully\s+compliant|ndis\s+approved|guaranteed\s+accessible|breaches?\s+the\s+law|discrimination\s+claim)\b/i;
const ABUSE_RE = /\b(kill\s+yourself|idiot|stupid\s+staff|retard)\b/i;
const UNSAFE_ADVICE_RE =
  /\b(ignore\s+warnings?|force\s+the\s+door|bypass\s+the\s+ramp|safe\s+for\s+everyone\s+guaranteed)\b/i;
const STAFF_NAME_RE =
  /\b(staff\s+member\s+[A-Z][a-z]+|[A-Z][a-z]+\s+(the\s+)?(manager|receptionist|waiter|barista)\b)/;
const PERSONAL_INFO_RE =
  /\b(my\s+(medicare|ndis\s+number|home\s+address)|dob\b|date\s+of\s+birth)\b/i;

/**
 * Pre-publish moderation for marker comments.
 * Principle: describe observed access conditions; do not make legal declarations.
 */
export function scanMarkerCommentForModeration(body: string): {
  flags: AccessMarkerModerationFlags;
  reasons: string[];
  needsReview: boolean;
} {
  const flags: AccessMarkerModerationFlags = {};
  const reasons: string[] = [];

  if (PHONE_RE.test(body) || EMAIL_RE.test(body) || PERSONAL_INFO_RE.test(body)) {
    flags.containsPersonalInfo = true;
    flags.privacyRisk = true;
    reasons.push("Possible personal information");
  }
  if (LEGAL_CLAIM_RE.test(body)) {
    flags.legalClaimRisk = true;
    reasons.push("Legal declaration rather than observation");
  }
  if (ABUSE_RE.test(body)) {
    flags.abusiveLanguage = true;
    reasons.push("Possible abusive language");
  }
  if (UNSAFE_ADVICE_RE.test(body)) {
    flags.unsafeAdvice = true;
    reasons.push("Possible unsafe access advice");
  }
  if (STAFF_NAME_RE.test(body)) {
    flags.privacyRisk = true;
    reasons.push("Possible named staff member");
  }

  return {
    flags,
    reasons,
    needsReview: reasons.length > 0,
  };
}
