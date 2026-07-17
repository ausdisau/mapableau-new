export type ContinuityCheck = {
  key: string;
  ok: boolean;
  detail: string;
};

export function evaluateContinuityChecks(params: {
  backupConfigured: boolean;
  restoreTestedWithinDays: number | null;
  maxRestoreAgeDays: number;
}): ContinuityCheck[] {
  return [
    {
      key: "backup_configured",
      ok: params.backupConfigured,
      detail: params.backupConfigured ? "Backup configuration present" : "Backup not configured",
    },
    {
      key: "restore_tested",
      ok:
        params.restoreTestedWithinDays !== null &&
        params.restoreTestedWithinDays <= params.maxRestoreAgeDays,
      detail:
        params.restoreTestedWithinDays === null
          ? "No restore test on record"
          : `Last restore test ${params.restoreTestedWithinDays} days ago`,
    },
  ];
}
