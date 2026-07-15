/**
 * Minimise sensitive data sent to model providers for Access chat.
 * Never send emails, phones, full names, or non-consented profile fields.
 */

import type { AccessSearchIntent } from "@/types/access-chat";

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE =
  /(?:\+?61|0)\s?[2-9](?:[\s-]?\d){8}|\b\d{4}[\s-]?\d{3}[\s-]?\d{3}\b/g;
const NAME_PREFIX_RE =
  /\b(?:my name is|i am|i'm)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/gi;

export function redactPersonalInformation(text: string): string {
  return text
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(PHONE_RE, "[redacted-phone]")
    .replace(NAME_PREFIX_RE, "[redacted-name]");
}

export type ConsentedAccessContext = NonNullable<
  AccessSearchIntent["userContext"]
>;

/** Only pass fields the user consented to share with AI providers. */
export function sanitiseUserContextForModel(
  context: ConsentedAccessContext | undefined,
  consented: boolean,
): ConsentedAccessContext | undefined {
  if (!consented || !context) return undefined;
  return {
    mobilityAid: context.mobilityAid,
    maxDistanceMeters: context.maxDistanceMeters,
    avoidCrowds: context.avoidCrowds,
    rampTolerance: context.rampTolerance,
    needsSupportPerson: context.needsSupportPerson,
  };
}

/** Review / comment text before embeddings or model grounding. */
export function stripReviewPii(body: string): string {
  return redactPersonalInformation(body).slice(0, 800);
}
