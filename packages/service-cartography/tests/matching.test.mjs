import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchServices, checkConsent, assessEvidence, DEFAULT_MATCH_WEIGHTS } from '../dist/index.js';
import { at, request, offered, consent, verified } from './fixtures.mjs';

test('matching fails closed without purpose-bound participant consent', () => {
  const result = matchServices({ request, offers: [offered], grants: [], at });
  assert.equal(result.status, 'consent_required');
  assert.deepEqual(result.ranked, []);
});

test('matching recommends a verified capable option, advisory only', () => {
  const result = matchServices({ request, offers: [offered], grants: [consent], at });
  assert.equal(result.status, 'advisory_options');
  assert.equal(result.ranked[0].providerId, 'provider-preferred');
  assert.equal(result.advisory.requiresParticipantConfirmation, true);
  assert.equal(result.advisory.requiresHumanReview, true);
});

test('a cheap but communication-inaccessible offer can never win', () => {
  const cheap = { ...offered, id: 'cheaper', providerId: 'cheap', priceCentsAUD: 1, communicationSupports: [] };
  const result = matchServices({ request, offers: [cheap, offered], grants: [consent], at });
  assert.equal(result.ranked.length, 1);
  assert.equal(result.ranked[0].offerId, 'offer-1');
  assert.ok(result.exclusions.find((e) => e.offerId === 'cheaper').reasons.includes('communication_access_missing'));
});

test('blocked provider stays excluded even if it is preferred and cheapest', () => {
  const blocked = { ...offered, id: 'blocked', providerId: 'provider-blocked', priceCentsAUD: 0 };
  const result = matchServices({ request, offers: [blocked], grants: [consent], at });
  assert.equal(result.status, 'no_verified_match');
  assert.ok(result.exclusions[0].reasons.includes('participant_blocked_provider'));
});

test('reported and expired evidence is never silently promoted to verified', () => {
  const reported = { ...offered, id: 'reported', evidence: { ...verified, status: 'reported' } };
  const expired = { ...offered, id: 'expired', evidence: { ...verified, expiresAt: '2026-11-01T00:00:00.000Z' } };
  const result = matchServices({ request, offers: [reported, expired], grants: [consent], at });
  assert.equal(result.status, 'no_verified_match');
  assert.equal(assessEvidence(expired.evidence, at).status, 'stale');
});

test('consent scope, expiry and revocation are enforced', () => {
  assert.equal(checkConsent({ grants:[consent], subjectId: request.participantId, purpose:'service_scheduling', recipientId:'mapable-engine',at }).authorised,false);
  assert.equal(checkConsent({ grants:[{...consent,revokedAt:'2026-11-17T00:00:00.000Z'}], subjectId:request.participantId,purpose:'service_matching',recipientId:'mapable-engine',at }).reason,'revoked');
  assert.equal(checkConsent({ grants:[consent], subjectId:request.participantId,purpose:'service_matching',recipientId:'different-recipient',at }).reason,'missing');
});

test('invalid weight vectors cannot weaken mandatory gates', () => {
  assert.throws(() => matchServices({request,offers:[offered],grants:[consent],at,
    weights:{ ...DEFAULT_MATCH_WEIGHTS, estimatedCost:2 }}));
});

test('matching is deterministic across input order', () => {
  const another = {...offered,id:'offer-2',providerId:'provider-other'};
  const a = matchServices({request,offers:[offered,another],grants:[consent],at});
  const b = matchServices({request,offers:[another,offered],grants:[consent],at});
  assert.deepEqual(a,b);
});

 test('verified records must expire after the service and have an expiry date', () => {
  const expiring = { ...offered, evidence: { ...verified, expiresAt:'2026-11-18T12:00:00.000Z' } };
  const eternal = { ...offered, id:'eternal', evidence: {sourceId:'unbounded',status:'verified',observedAt:verified.observedAt} };
  const r=matchServices({request,offers:[expiring,eternal],grants:[consent],at});
  assert.equal(r.status,'no_verified_match');
 });

 test('past requests and timezone-ambiguous timestamps are not matched',()=>{
  assert.equal(matchServices({request:{...request,startsAt:'2026-11-18T02:00:00Z',endsAt:'2026-11-18T02:30:00Z'},offers:[offered],grants:[consent],at}).status,'invalid_request');
  assert.equal(matchServices({request:{...request,startsAt:'2026-11-19'},offers:[offered],grants:[consent],at}).status,'invalid_request');
 });
