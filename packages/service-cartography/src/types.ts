/** All IDs are opaque strings. Callers must not treat them as verified credentials. */
export type EvidenceStatus = 'verified' | 'reported' | 'unknown' | 'disputed';

export interface Evidence {
  sourceId: string;
  status: EvidenceStatus;
  observedAt: string; // ISO 8601 instant, supplied by the caller
  expiresAt?: string;
  note?: string;
}

export type ConsentPurpose = 'service_matching' | 'service_scheduling' | 'personal_route';

export interface ConsentGrant {
  grantId: string;
  subjectId: string;
  purpose: ConsentPurpose;
  recipientIds: readonly string[];
  grantedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface ServiceRequest {
  id: string;
  participantId: string;
  requiredCapabilities: readonly string[];
  communicationRequirements: readonly string[];
  startsAt: string;
  endsAt: string;
  preferredProviderIds?: readonly string[];
  blockedProviderIds?: readonly string[];
}

export interface ServiceOffer {
  id: string;
  providerId: string;
  capabilities: readonly string[];
  communicationSupports: readonly string[];
  availableFrom: string;
  availableUntil: string;
  confirmedAvailability: boolean;
  reliability: number; // measured rate in [0, 1], not a moral/personhood score
  estimatedTravelMinutes: number;
  priceCentsAUD: number; // display estimate only, not an NDIS eligibility decision
  evidence: Evidence;
}

export interface DecisionExplanation {
  code: string;
  detail: string;
}

export interface AdvisoryMeta {
  disposition: 'advisory_only';
  requiresParticipantConfirmation: true;
  requiresHumanReview: true;
}

export const ADVISORY_META: AdvisoryMeta = {
  disposition: 'advisory_only',
  requiresParticipantConfirmation: true,
  requiresHumanReview: true,
};

/** No time is silently inferred; callers supply a reference instant for deterministic replay. */
export function timestamp(value: string): number | null {
  // Reject locale-dependent strings and timestamps with no explicit timezone.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const n = Date.parse(value);
  return Number.isFinite(n) ? n : null;
}

export function isValidInterval(start: string, end: string): boolean {
  const a = timestamp(start);
  const b = timestamp(end);
  return a !== null && b !== null && a < b;
}

export function coversInterval(from: string, until: string, start: string, end: string): boolean {
  const f = timestamp(from);
  const u = timestamp(until);
  const s = timestamp(start);
  const e = timestamp(end);
  return f !== null && u !== null && s !== null && e !== null && f <= s && u >= e && s < e;
}

export function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
