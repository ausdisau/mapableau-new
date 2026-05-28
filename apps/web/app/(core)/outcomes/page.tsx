import { listPublishedOutcomes } from "@/lib/long-term-outcomes/outcomes-service";

export default async function OutcomesPage() {
  const outcomes = await listPublishedOutcomes();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Long-term outcomes</h1>
      <p className="text-muted-foreground">
        Published outcome snapshots — suppressed when cohorts are too small.
      </p>
      <ul className="space-y-3">
        {outcomes.map((o) => (
          <li key={o.id} className="rounded-lg border p-4">
            <strong>{o.outcomeKey}</strong>
            <span className="ml-2 text-sm">({o.periodLabel})</span>
            <p className="text-sm">
              {o.suppressed ? "Suppressed" : o.value ?? "n/a"}
            </p>
            {o.narrative ? (
              <p className="text-xs text-muted-foreground">{o.narrative}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
