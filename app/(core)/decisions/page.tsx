import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublicDecisions } from "@/lib/public-decision-register/decision-service";

export default async function PublicDecisionsPage() {
  const decisions = await listPublicDecisions();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Public decision register"
        description="Recorded governance and policy decisions — not legal advice."
      />
      {decisions.length === 0 ? (
        <CoreEmptyState
          title="No decisions published"
          description="Governance and policy decisions will be listed here once published."
        />
      ) : (
        <ul className="space-y-4">
          {decisions.map((d) => (
            <li key={d.id}>
              <CoreRecordCard
                title={d.title}
                meta={
                  <>
                    {d.decisionType}
                    {d.publishedAt
                      ? ` — ${d.publishedAt.toLocaleDateString("en-AU")}`
                      : ""}
                  </>
                }
              >
                <p>{d.summary}</p>
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
