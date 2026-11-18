import type { ConsentGrant, ConsentPurpose } from './types';
import { timestamp } from './types';

export interface ConsentDecision {
  authorised: boolean;
  reason: 'granted' | 'missing' | 'revoked' | 'expired' | 'not_yet_valid' | 'out_of_scope';
  grantId: string | null;
}

/** Consent is purpose-, person-, recipient- and time-scoped. No default allow. */
export function checkConsent(input: {
  grants: readonly ConsentGrant[];
  subjectId: string;
  purpose: ConsentPurpose;
  recipientId: string;
  at: string;
}): ConsentDecision {
  const now = timestamp(input.at);
  if (now === null) return { authorised: false, reason: 'out_of_scope', grantId: null };
  const matches = input.grants
    .filter((g) => g.subjectId === input.subjectId && g.purpose === input.purpose && g.recipientIds.includes(input.recipientId))
    .sort((a, b) => a.grantId.localeCompare(b.grantId));
  if (matches.length === 0) return { authorised: false, reason: 'missing', grantId: null };
  let mostRecentDenial: ConsentDecision = { authorised: false, reason: 'expired', grantId: null };
  for (const grant of matches) {
    const start = timestamp(grant.grantedAt);
    const expiry = timestamp(grant.expiresAt);
    const revocation = grant.revokedAt ? timestamp(grant.revokedAt) : null;
    if (start === null || expiry === null || (grant.revokedAt && revocation === null)) {
      mostRecentDenial = { authorised: false, reason: 'out_of_scope', grantId: grant.grantId };
      continue;
    }
    if (revocation !== null && revocation <= now) {
      mostRecentDenial = { authorised: false, reason: 'revoked', grantId: grant.grantId };
      continue;
    }
    if (now < start) {
      mostRecentDenial = { authorised: false, reason: 'not_yet_valid', grantId: grant.grantId };
      continue;
    }
    if (now >= expiry) {
      mostRecentDenial = { authorised: false, reason: 'expired', grantId: grant.grantId };
      continue;
    }
    return { authorised: true, reason: 'granted', grantId: grant.grantId };
  }
  return mostRecentDenial;
}
