import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublicTransparency } from "@/lib/public-transparency/transparency-service";

export default async function TransparencyHubPage() {
  const publications = await listPublicTransparency();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Public transparency"
        description="Approved aggregate governance information only."
      />
      {publications.length === 0 ? (
        <CoreEmptyState
          title="No transparency publications"
          description="Approved governance publications will be listed here."
        />
      ) : (
        <ul className="space-y-4">
          {publications.map((p) => (
            <li key={p.id}>
              <CoreRecordCard
                title={p.title}
                meta={
                  p.publishedAt
                    ? `Published ${p.publishedAt.toLocaleDateString("en-AU")}`
                    : undefined
                }
              >
                <p>{p.body}</p>
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
