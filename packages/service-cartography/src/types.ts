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

const ISO_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

/** No time is silently inferred; callers supply a reference instant for deterministic replay. */
export function timestamp(value: string): number | null {
  // Reject locale-dependent strings, timestamps with no explicit timezone, and
  // calendar values that Date.parse would silently overflow (e.g. 2026-02-30).
  if (typeof value !== 'string') return null;
  const match = ISO_INSTANT.exec(value);
  if (!match) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const millisecond = match[7] ? Number(match[7].padEnd(3, '0')) : 0;
  const tz = match[8];
  if (!tz) return null;
  let offsetMinutes = 0;
  if (tz !== 'Z') {
    const sign = tz.startsWith('-') ? -1 : 1;
    offsetMinutes = sign * (Number(tz.slice(1, 3)) * 60 + Number(tz.slice(4, 6)));
  }
  const wall = new Date(parsed + offsetMinutes * 60_000);
  if (
    wall.getUTCFullYear() !== year ||
    wall.getUTCMonth() + 1 !== month ||
    wall.getUTCDate() !== day ||
    wall.getUTCHours() !== hour ||
    wall.getUTCMinutes() !== minute ||
    wall.getUTCSeconds() !== second ||
    wall.getUTCMilliseconds() !== millisecond
  ) {
    return null;
  }
  return parsed;
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
