export type PilotRetentionPolicy = {
  decisionRecordsYears: number;
  enrolmentRecordsYears: number;
  ledgerYears: number;
  softDeleteAfterCloseDays: number;
};

export const DEFAULT_PILOT_RETENTION: PilotRetentionPolicy = {
  decisionRecordsYears: 7,
  enrolmentRecordsYears: 7,
  ledgerYears: 7,
  softDeleteAfterCloseDays: 30,
};

export function retentionDueDate(
  closedAt: Date,
  policy: PilotRetentionPolicy = DEFAULT_PILOT_RETENTION
): Date {
  return new Date(
    closedAt.getTime() + policy.softDeleteAfterCloseDays * 24 * 60 * 60 * 1000
  );
}
