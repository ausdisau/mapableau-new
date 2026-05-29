import {
  CoreCivicNav,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { getLatestStatusPage, runPlatformHealthChecks } from "@/lib/platform-status/status-service";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  let health;
  try {
    health = await runPlatformHealthChecks();
  } catch {
    health = {
      status: "degraded",
      checkedAt: new Date().toISOString(),
      checks: [],
      nationalInfrastructure: false,
    };
  }
  const latest = await getLatestStatusPage().catch(() => ({
    components: [],
    partnerMarketplace: false,
  }));

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="MapAble status"
        description="Operational health — not a legal SLA commitment."
      />
      <CoreRecordCard
        title={`Overall: ${health.status}`}
        meta={`Checked ${new Date(health.checkedAt).toLocaleString("en-AU")}`}
      />
      {health.checks.length > 0 ? (
        <section aria-labelledby="status-checks-heading">
          <h2 id="status-checks-heading" className="font-heading text-lg font-semibold">
            Components
          </h2>
          <ul className="mt-4 space-y-4">
            {health.checks.map((c) => (
              <li key={c.component}>
                <CoreRecordCard title={c.component} meta={c.status}>
                  <p className="text-muted-foreground">{c.message}</p>
                </CoreRecordCard>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {latest.components.length > 0 ? (
        <section aria-labelledby="status-recent-heading">
          <h2 id="status-recent-heading" className="font-heading text-lg font-semibold">
            Recent checks
          </h2>
          <ul className="mt-4 space-y-4">
            {latest.components.map((c) => (
              <li key={c.id}>
                <CoreRecordCard
                  title={c.component}
                  meta={c.status}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </CorePageContainer>
  );
}
