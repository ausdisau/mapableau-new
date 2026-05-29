import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublishedAccreditation } from "@/lib/accreditation-public-program/public-accreditation-service";

export default async function PublicAccreditationPage() {
  const profiles = await listPublishedAccreditation();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Accessibility accreditation"
        description="Published profiles only. Not legal certification unless explicitly stated."
      />
      {profiles.length === 0 ? (
        <CoreEmptyState
          title="No accreditation profiles"
          description="Published accreditation summaries will appear here when available."
        />
      ) : (
        <ul className="space-y-4">
          {profiles.map((p) => (
            <li key={p.id}>
              <CoreRecordCard title={p.title}>
                <p>{p.summary}</p>
                <p className="mt-2 text-xs italic text-muted-foreground">{p.disclaimer}</p>
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
