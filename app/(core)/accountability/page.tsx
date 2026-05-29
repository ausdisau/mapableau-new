import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublicAccountabilityReports } from "@/lib/national-accountability/accountability-service";

export default async function AccountabilityPortalPage() {
  const reports = await listPublicAccountabilityReports();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="National accountability portal"
        description="Published aggregate accountability reports — no participant-identifiable data."
      />
      {reports.length === 0 ? (
        <CoreEmptyState
          title="No reports published yet"
          description="Check back when aggregate accountability reports are approved for publication."
        />
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={r.id}>
              <CoreRecordCard
                title={r.title}
                meta={`${r.category} — ${r.periodLabel}`}
              >
                <p>{r.summary}</p>
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
