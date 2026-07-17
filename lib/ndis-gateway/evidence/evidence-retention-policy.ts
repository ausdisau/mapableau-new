/** Evidence retention windows (days). Policy constants only — no PII. */
export const EVIDENCE_RETENTION_POLICY = {
  /** Minimum retention for NDIS claim evidence after payment. */
  minRetentionDaysAfterPayment: 365 * 7,
  /** Soft archive hint after supersession. */
  archiveAfterSupersededDays: 90,
  schemaVersion: "1",
} as const;

export function evidenceRetentionExpiresAt(
  paidAt: Date,
  now = new Date()
): { expiresAt: Date; retain: boolean } {
  const expiresAt = new Date(paidAt);
  expiresAt.setUTCDate(
    expiresAt.getUTCDate() + EVIDENCE_RETENTION_POLICY.minRetentionDaysAfterPayment
  );
  return { expiresAt, retain: now < expiresAt };
}
