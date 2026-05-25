export function UnmetNeedAdminDashboard() {
  return (
    <section aria-label="Admin unmet needs">
      <p className="text-sm text-muted-foreground">
        Use the aggregates API at /api/admin/unmet-needs/aggregates for service gap insights.
      </p>
    </section>
  );
}
