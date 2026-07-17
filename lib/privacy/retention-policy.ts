export type RetentionRule = {
  dataCategory: string;
  retainDays: number;
  failClosed: true;
};

export const DEFAULT_RETENTION_RULES: RetentionRule[] = [
  { dataCategory: "assurance_evidence", retainDays: 2555, failClosed: true },
  { dataCategory: "worker_credentials_metadata", retainDays: 2555, failClosed: true },
  { dataCategory: "operational_incidents", retainDays: 2555, failClosed: true },
];

export function retentionExceeded(params: {
  collectedAt: Date;
  retainDays: number;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  const ageDays =
    (now.getTime() - params.collectedAt.getTime()) / (24 * 60 * 60 * 1000);
  return ageDays > params.retainDays;
}
