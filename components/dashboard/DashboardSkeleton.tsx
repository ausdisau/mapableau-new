export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
      <div className="h-24 rounded-xl bg-muted" />
    </div>
  );
}
