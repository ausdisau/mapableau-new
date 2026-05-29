import {
  CoreCivicNav,
  CoreEmptyState,
  CoreMetricsGrid,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublishedNationalInsights } from "@/lib/national-insights/insights-service";

export default async function NationalInsightsPage() {
  const snapshots = await listPublishedNationalInsights();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="National insights"
        description="Aggregate, suppressed metrics only. No participant-identifiable data."
      />
      {snapshots.length === 0 ? (
        <CoreEmptyState
          title="No insight snapshots"
          description="Published national insight periods will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {snapshots.map((s) => (
            <li key={s.id}>
              <CoreRecordCard title={s.periodLabel}>
                <CoreMetricsGrid
                  metrics={
                    s.metricsJson && typeof s.metricsJson === "object" && !Array.isArray(s.metricsJson)
                      ? (s.metricsJson as Record<string, unknown>)
                      : {}
                  }
                  suppressed={s.suppressed}
                  suppressionMessage="Some metrics suppressed (small cell)"
                />
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
