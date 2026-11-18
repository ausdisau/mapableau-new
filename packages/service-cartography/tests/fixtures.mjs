export const at = '2026-11-18T03:00:00.000Z';
export const request = {
  id: 'synthetic-request-1', participantId: 'synthetic-person-1',
  requiredCapabilities: ['community-access'], communicationRequirements: ['aac-text'],
  startsAt: '2026-11-19T00:00:00.000Z', endsAt: '2026-11-19T02:00:00.000Z',
  preferredProviderIds: ['provider-preferred'], blockedProviderIds: ['provider-blocked'],
};
export const verified = {
  sourceId: 'synthetic-assessor-2026', status: 'verified',
  observedAt: '2026-11-17T00:00:00.000Z', expiresAt: '2026-12-01T00:00:00.000Z',
};
export const offered = {
  id: 'offer-1', providerId: 'provider-preferred', capabilities: ['community-access'],
  communicationSupports: ['aac-text'], availableFrom: '2026-11-19T00:00:00.000Z',
  availableUntil: '2026-11-19T04:00:00.000Z', confirmedAvailability: true,
  reliability: 0.9, estimatedTravelMinutes: 15, priceCentsAUD: 12000, evidence: verified,
};
export const consent = {
  grantId: 'grant-1', subjectId: 'synthetic-person-1',
  purpose: 'service_matching', recipientIds: ['mapable-engine'],
  grantedAt: '2026-11-01T00:00:00.000Z', expiresAt: '2026-12-01T00:00:00.000Z',
};
