import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listActiveSafeguards } from "@/lib/constitutional-safeguards/safeguards-service";

export default async function SafeguardsPage() {
  const articles = await listActiveSafeguards();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Platform constitutional safeguards"
        description="Operating principles — not a substitute for legal compliance or statute."
      />
      {articles.length === 0 ? (
        <CoreEmptyState
          title="No safeguards published"
          description="Active constitutional safeguard articles will appear here."
        />
      ) : (
        <ol className="list-decimal space-y-4 pl-5 marker:font-semibold">
          {articles.map((a) => (
            <li key={a.id}>
              <CoreRecordCard title={a.title}>
                <p>{a.body}</p>
              </CoreRecordCard>
            </li>
          ))}
        </ol>
      )}
    </CorePageContainer>
  );
}
