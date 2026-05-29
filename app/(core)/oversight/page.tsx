import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { getOversightPortalSummary } from "@/lib/oversight-board/oversight-service";

export default async function OversightPage() {
  const data = await getOversightPortalSummary();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Oversight board"
        description="Published meetings and decisions from the oversight board portal."
      />
      {data.disabled ? (
        <CoreEmptyState
          title="Oversight portal not enabled"
          description="The oversight board portal is not enabled in this environment."
        />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="oversight-meetings-heading">
            <h2 id="oversight-meetings-heading" className="font-heading text-lg font-semibold">
              Meetings
            </h2>
            {data.meetings.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No meetings listed.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {data.meetings.map((m) => (
                  <li key={m.id}>
                    <CoreRecordCard title={m.title} meta={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="oversight-decisions-heading">
            <h2 id="oversight-decisions-heading" className="font-heading text-lg font-semibold">
              Published decisions
            </h2>
            {data.decisions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No published decisions.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {data.decisions.map((d) => (
                  <li key={d.id}>
                    <CoreRecordCard title={d.title}>
                      <p className="text-muted-foreground">{d.summary}</p>
                    </CoreRecordCard>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </CorePageContainer>
  );
}
