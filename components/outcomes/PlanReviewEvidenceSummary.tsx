export function PlanReviewEvidenceSummary({ summary }: { summary: Record<string, unknown> }) {
  return (
    <section className="rounded-xl border p-4 text-sm">
      <h2 className="font-heading text-lg font-semibold">Plan review summary</h2>
      <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(summary, null, 2)}</pre>
      <p className="mt-2 text-muted-foreground">
        This summary supports planning — it is not funding or legal advice.
      </p>
    </section>
  );
}
