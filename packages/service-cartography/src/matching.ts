import type { ConsentGrant, DecisionExplanation, ServiceOffer, ServiceRequest } from './types';
import { ADVISORY_META, coversInterval, isValidInterval, timestamp } from './types';
import { checkConsent } from './consent';
import { assessEvidence } from './evidence';

export interface MatchWeights {
  participantPreference: number;
  reliability: number;
  travel: number;
  estimatedCost: number;
}

/** Preference weights apply only after rights, consent, capability and verification gates. */
export const DEFAULT_MATCH_WEIGHTS: Readonly<MatchWeights> = {
  participantPreference: 0.45,
  reliability: 0.30,
  travel: 0.15,
  estimatedCost: 0.10,
};

export interface RankedOffer {
  offerId: string;
  providerId: string;
  score: number;
  components: Readonly<MatchWeights>;
  evidenceSourceId: string;
  explanation: readonly DecisionExplanation[];
}

export interface MatchResult {
  status: 'consent_required' | 'invalid_request' | 'no_verified_match' | 'advisory_options';
  ranked: RankedOffer[];
  exclusions: Array<{ offerId: string; reasons: string[] }>;
  consentGrantId: string | null;
  advisory: typeof ADVISORY_META;
}

function validateWeights(weights: MatchWeights): void {
  const values = [
    weights.participantPreference,
    weights.reliability,
    weights.travel,
    weights.estimatedCost,
  ];
  if (values.some((v) => !Number.isFinite(v) || v < 0) || Math.abs(values.reduce((a, b) => a + b, 0) - 1) > 1e-9) {
    throw new Error('Match weights must be finite, non-negative, and sum to 1');
  }
}

export function matchServices(input: {
  request: ServiceRequest;
  offers: readonly ServiceOffer[];
  grants: readonly ConsentGrant[];
  at: string;
  weights?: MatchWeights;
}): MatchResult {
  const weights = input.weights ?? DEFAULT_MATCH_WEIGHTS;
  validateWeights(weights);
  const empty: MatchResult = { status: 'no_verified_match', ranked: [], exclusions: [], consentGrantId: null, advisory: ADVISORY_META };
  const r = input.request;
  const now = timestamp(input.at);
  const starts = timestamp(r.startsAt);
  if (!r.id || !r.participantId || !isValidInterval(r.startsAt, r.endsAt) || now === null || starts === null || starts <= now) {
    return { ...empty, status: 'invalid_request' };
  }
  const consent = checkConsent({ grants: input.grants, subjectId: r.participantId,
    purpose: 'service_matching', recipientId: 'mapable-engine', at: input.at });
  if (!consent.authorised) return { ...empty, status: 'consent_required' };
  const ranked: RankedOffer[] = [];
  const exclusions: MatchResult['exclusions'] = [];
  for (const offer of [...input.offers].sort((a,b) => a.id.localeCompare(b.id))) {
    const reasons: string[] = [];
    if (r.blockedProviderIds?.includes(offer.providerId)) reasons.push('participant_blocked_provider');
    if (!offer.confirmedAvailability || !coversInterval(offer.availableFrom, offer.availableUntil, r.startsAt, r.endsAt)) {
      reasons.push('availability_not_confirmed');
    }
    if (!assessEvidence(offer.evidence, input.at).usableForVerifiedClaim ||
        !assessEvidence(offer.evidence, r.endsAt).usableForVerifiedClaim) {
      reasons.push('capability_evidence_not_verified_through_service');
    }
    if (r.requiredCapabilities.some((cap) => !offer.capabilities.includes(cap))) reasons.push('required_capability_missing');
    if (r.communicationRequirements.some((cap) => !offer.communicationSupports.includes(cap))) reasons.push('communication_access_missing');
    if (![offer.reliability, offer.estimatedTravelMinutes, offer.priceCentsAUD].every(Number.isFinite) ||
        offer.reliability < 0 || offer.reliability > 1 || offer.estimatedTravelMinutes < 0 || offer.priceCentsAUD < 0) {
      reasons.push('invalid_operational_data');
    }
    if (reasons.length) { exclusions.push({ offerId: offer.id, reasons }); continue; }
    const preference = r.preferredProviderIds?.length ? (r.preferredProviderIds.includes(offer.providerId) ? 1 : 0) : 0.5;
    const travel = 1 / (1 + offer.estimatedTravelMinutes / 30);
    const cost = 1 / (1 + offer.priceCentsAUD / 10000);
    const components = {
      participantPreference: preference * weights.participantPreference,
      reliability: offer.reliability * weights.reliability,
      travel: travel * weights.travel,
      estimatedCost: cost * weights.estimatedCost,
    };
    const score = Object.values(components).reduce((a,b)=>a+b,0);
    ranked.push({
      offerId: offer.id, providerId: offer.providerId, score: Number(score.toFixed(8)), components,
      evidenceSourceId: offer.evidence.sourceId,
      explanation: [{ code: 'eligible_for_comparison', detail: 'Mandatory consent, availability, capability, communication and evidence gates passed; not a booking or funding decision.' }],
    });
  }
  ranked.sort((a,b) => b.score - a.score || a.offerId.localeCompare(b.offerId));
  return {
    status: ranked.length ? 'advisory_options' : 'no_verified_match', ranked, exclusions,
    consentGrantId: consent.grantId, advisory: ADVISORY_META,
  };
}
