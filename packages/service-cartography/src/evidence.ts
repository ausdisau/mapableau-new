import type { Evidence, EvidenceStatus } from './types';
import { timestamp } from './types';

export interface EvidenceAssessment {
  status: EvidenceStatus | 'stale';
  usableForVerifiedClaim: boolean;
  sourceId: string;
}

/** Never upgrade unknown/reported to verified based on a heuristic. */
export function assessEvidence(evidence: Evidence, at: string): EvidenceAssessment {
  const now = timestamp(at);
  const observed = timestamp(evidence.observedAt);
  const expiry = evidence.expiresAt ? timestamp(evidence.expiresAt) : null;
  if (now === null || observed === null || observed > now || (evidence.expiresAt && expiry === null)) {
    return { status: 'unknown', usableForVerifiedClaim: false, sourceId: evidence.sourceId };
  }
  if (evidence.status === 'verified' && !evidence.expiresAt) {
    // A permanent verification is not credible for changeable service/route conditions.
    return { status: 'unknown', usableForVerifiedClaim: false, sourceId: evidence.sourceId };
  }
  if (evidence.status === 'disputed') {
    return { status: 'disputed', usableForVerifiedClaim: false, sourceId: evidence.sourceId };
  }
  if (expiry !== null && now >= expiry) {
    return { status: 'stale', usableForVerifiedClaim: false, sourceId: evidence.sourceId };
  }
  return {
    status: evidence.status,
    usableForVerifiedClaim: evidence.status === 'verified',
    sourceId: evidence.sourceId,
  };
}
