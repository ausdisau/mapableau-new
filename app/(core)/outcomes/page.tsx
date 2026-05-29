import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublishedOutcomes } from "@/lib/long-term-outcomes/outcomes-service";

export default async function OutcomesPage() {
  const outcomes = await listPublishedOutcomes();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Long-term outcomes"
        description="Published outcome snapshots — suppressed when cohorts are too small."
      />
      {outcomes.length === 0 ? (
        <CoreEmptyState
          title="No outcomes published"
          description="Long-term outcome snapshots will appear here when published."
        />
      ) : (
        <ul className="space-y-4">
          {outcomes.map((o) => (
            <li key={o.id}>
              <CoreRecordCard
                title={o.outcomeKey}
                meta={o.periodLabel}
              >
                <p>
                  {o.suppressed ? (
                    <span className="text-amber-800 dark:text-amber-200">Suppressed</span>
                  ) : (
                    (o.value ?? "n/a")
                  )}
                </p>
                {o.narrative ? (
                  <p className="mt-2 text-xs text-muted-foreground">{o.narrative}</p>
                ) : null}
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
