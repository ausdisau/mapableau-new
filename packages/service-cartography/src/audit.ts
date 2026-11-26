/** An audit payload, NOT an immutable audit ledger; persistence/signing belongs to host application. */
export interface DecisionAuditEvent {
  eventId: string;
  occurredAt: string;
  algorithmId: string;
  algorithmVersion: string;
  inputReferenceIds: readonly string[]; // references not raw personal data
  outcome: 'advisory' | 'blocked' | 'no_confirmed_option';
  reasonCodes: readonly string[];
  humanReviewRequired: true;
}

export function createDecisionAuditEvent(event: DecisionAuditEvent): DecisionAuditEvent {
  if (!event.eventId || !event.algorithmId || !event.algorithmVersion ||
      !Number.isFinite(Date.parse(event.occurredAt)) || !event.humanReviewRequired) {
    throw new Error('Audit event missing required attribution and human review fields');
  }
  return {
    ...event,
    inputReferenceIds: [...new Set(event.inputReferenceIds)].sort(),
    reasonCodes: [...new Set(event.reasonCodes)].sort(),
  };
}
