export function ContributorStats({
  stats,
}: {
  stats: {
    reports: number;
    verifications: number;
    alerts: number;
    totalPoints: number;
  };
}) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-lg border border-border p-3">
        <dt className="text-sm text-muted-foreground">Reports</dt>
        <dd className="text-2xl font-bold">{stats.reports}</dd>
      </div>
      <div className="rounded-lg border border-border p-3">
        <dt className="text-sm text-muted-foreground">Verifications</dt>
        <dd className="text-2xl font-bold">{stats.verifications}</dd>
      </div>
      <div className="rounded-lg border border-border p-3">
        <dt className="text-sm text-muted-foreground">Alerts</dt>
        <dd className="text-2xl font-bold">{stats.alerts}</dd>
      </div>
      <div className="rounded-lg border border-border p-3">
        <dt className="text-sm text-muted-foreground">Points</dt>
        <dd className="text-2xl font-bold">{stats.totalPoints}</dd>
      </div>
    </dl>
  );
}
