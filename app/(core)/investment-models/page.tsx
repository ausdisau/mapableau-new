import {
  CoreCivicNav,
  CoreEmptyState,
  CoreMetricsGrid,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublishedInvestmentModels } from "@/lib/transport-investment-modelling/investment-model-service";

export default async function InvestmentModelsPage() {
  const models = await listPublishedInvestmentModels();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Transport investment modelling"
        description="Scenario outputs for planning discussion — not investment advice."
      />
      {models.length === 0 ? (
        <CoreEmptyState
          title="No scenarios published"
          description="Published transport investment scenarios will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {models.map((m) => (
            <li key={m.id}>
              <CoreRecordCard title={m.title} meta={m.scenarioKey}>
                <CoreMetricsGrid
                  metrics={
                    m.outputsJson && typeof m.outputsJson === "object" && !Array.isArray(m.outputsJson)
                      ? (m.outputsJson as Record<string, unknown>)
                      : {}
                  }
                  suppressed={m.suppressed}
                  suppressionMessage="Outputs suppressed (small cohort)"
                />
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
