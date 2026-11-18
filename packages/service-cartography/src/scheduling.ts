import type { ConsentGrant, ServiceRequest } from './types';
import { ADVISORY_META, coversInterval, isValidInterval, timestamp } from './types';
import { checkConsent } from './consent';
import { assessEvidence } from './evidence';
import type { Evidence } from './types';

export interface ResourceSlot {
  id: string;
  providerId: string;
  resourceIds: readonly string[]; // opaque vehicle/worker IDs, NOT personal profiles
  capabilities: readonly string[];
  communicationSupports: readonly string[];
  from: string;
  until: string;
  available: boolean;
  evidence: Evidence;
}
export interface ScheduleProposal {
  requestId: string;
  slotId: string;
  providerId: string;
  requiresParticipantConfirmation: true;
  requiresHumanReview: true;
}
export interface ScheduleOutcome {
  proposals: ScheduleProposal[];
  notScheduled: Array<{ requestId: string; reason: string }>;
  advisory: typeof ADVISORY_META;
  methodology: 'fewest_valid_options_first_greedy_not_globally_optimal';
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const a = timestamp(aStart); const b = timestamp(aEnd);
  const c = timestamp(bStart); const d = timestamp(bEnd);
  return a !== null && b !== null && c !== null && d !== null && a < d && c < b;
}

/** Deterministic, no-execution capacity suggestions. Never books a shift, worker or vehicle. */
export function proposeServiceSchedule(input: {
  requests: readonly ServiceRequest[];
  slots: readonly ResourceSlot[];
  grants: readonly ConsentGrant[];
  at: string;
}): ScheduleOutcome {
  const proposals: ScheduleProposal[] = [];
  const notScheduled: ScheduleOutcome['notScheduled'] = [];
  const used: Array<{ slot: ResourceSlot; request: ServiceRequest }> = [];
  const validSlots = [...input.slots].filter((s) => s.available && isValidInterval(s.from,s.until) &&
    assessEvidence(s.evidence, input.at).usableForVerifiedClaim);
  function candidates(r: ServiceRequest): ResourceSlot[] {
    return validSlots.filter((s) => !r.blockedProviderIds?.includes(s.providerId) &&
      coversInterval(s.from, s.until, r.startsAt, r.endsAt) &&
      assessEvidence(s.evidence, r.endsAt).usableForVerifiedClaim &&
      r.requiredCapabilities.every((cap) => s.capabilities.includes(cap)) &&
      r.communicationRequirements.every((cap) => s.communicationSupports.includes(cap)));
  }
  const admissible: Array<{ request: ServiceRequest; slots: ResourceSlot[] }> = [];
  for (const r of input.requests) {
    if (!isValidInterval(r.startsAt, r.endsAt) || timestamp(input.at) === null || timestamp(r.startsAt)! <= timestamp(input.at)!) {
      notScheduled.push({ requestId: r.id, reason: 'invalid_request_interval' }); continue;
    }
    const consent = checkConsent({ grants: input.grants, subjectId: r.participantId,
      purpose: 'service_scheduling', recipientId: 'mapable-engine', at: input.at });
    if (!consent.authorised) { notScheduled.push({ requestId: r.id, reason: 'consent_required' }); continue; }
    const valid = candidates(r);
    if (!valid.length) { notScheduled.push({ requestId: r.id, reason: 'no_verified_suitable_capacity' }); continue; }
    admissible.push({ request: r, slots: valid });
  }
  admissible.sort((a, b) => a.slots.length - b.slots.length ||
    a.request.startsAt.localeCompare(b.request.startsAt) || a.request.id.localeCompare(b.request.id));
  for (const { request, slots } of admissible) {
    const eligible = [...slots].sort((a, b) => {
      const aPref = request.preferredProviderIds?.includes(a.providerId) ? 1 : 0;
      const bPref = request.preferredProviderIds?.includes(b.providerId) ? 1 : 0;
      return bPref-aPref || a.id.localeCompare(b.id);
    });
    const selected = eligible.find((s) => !used.some(({ slot, request: booked }) =>
      (slot.id === s.id || slot.resourceIds.some((res) => s.resourceIds.includes(res))) &&
      overlaps(request.startsAt,request.endsAt,booked.startsAt,booked.endsAt)));
    if (!selected) { notScheduled.push({ requestId: request.id, reason: 'resource_conflict_or_capacity_exhausted' }); continue; }
    used.push({ slot: selected, request });
    proposals.push({ requestId: request.id, slotId: selected.id, providerId: selected.providerId,
      requiresParticipantConfirmation: true, requiresHumanReview: true });
  }
  proposals.sort((a,b) => a.requestId.localeCompare(b.requestId));
  notScheduled.sort((a,b) => a.requestId.localeCompare(b.requestId));
  return { proposals, notScheduled, advisory: ADVISORY_META,
    methodology: 'fewest_valid_options_first_greedy_not_globally_optimal' };
}
