import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreProseBlock,
  CoreRecordCard,
} from "@/components/core";
import { getActiveCharter } from "@/lib/governance-charter/charter-service";

export default async function GovernanceCharterPage() {
  const charter = await getActiveCharter();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Governance charter"
        description="Ratified platform governance charter for public review."
      />
      {charter ? (
        <CoreRecordCard title={charter.title} meta={`Version ${charter.version}`}>
          <CoreProseBlock>
            <p className="whitespace-pre-wrap">{charter.body}</p>
          </CoreProseBlock>
        </CoreRecordCard>
      ) : (
        <CoreEmptyState
          title="No ratified charter published"
          description="Draft versions are managed in admin. Check back when a charter is ratified for publication."
        />
      )}
    </CorePageContainer>
  );
}
