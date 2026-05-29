import Link from "next/link";

import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublishedAlgorithms } from "@/lib/algorithm-register/register-service";

export default async function AlgorithmsPage() {
  const algorithms = await listPublishedAlgorithms();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Public algorithm register"
        description="Algorithms used in MapAble — transparency, not legal certification of fairness."
      >
        <p className="text-sm text-muted-foreground">
          <Link href="/peers" className="font-medium text-primary hover:underline">
            MapAble PEERS
          </Link>{" "}
          does not use additive feed ranking; discussion rooms stay chronological.
        </p>
      </CorePageHeader>
      {algorithms.length === 0 ? (
        <CoreEmptyState
          title="No algorithms published"
          description="Published algorithm register entries will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {algorithms.map((a) => (
            <li key={a.id}>
              <CoreRecordCard
                title={
                  <>
                    {a.name}{" "}
                    <span className="text-sm font-normal text-muted-foreground">v{a.version}</span>
                  </>
                }
              >
                <p>{a.purpose}</p>
                {a.fairnessNotes ? (
                  <p className="mt-2 text-xs text-muted-foreground">{a.fairnessNotes}</p>
                ) : null}
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
