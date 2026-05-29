import {
  CoreCivicNav,
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listPublicMembershipDirectory } from "@/lib/community-governance-membership/membership-service";

export default async function MembershipDirectoryPage() {
  const members = await listPublicMembershipDirectory();

  return (
    <CorePageContainer variant="narrow">
      <CoreCivicNav />
      <CorePageHeader
        eyebrow="Public accountability"
        title="Community governance membership"
        description="Public directory labels only — no personal contact details."
      />
      {members.length === 0 ? (
        <CoreEmptyState
          title="No public members listed"
          description="Community governance directory entries will appear here when published."
        />
      ) : (
        <ul className="space-y-4">
          {members.map((m) => (
            <li key={m.id}>
              <CoreRecordCard
                title={m.memberLabel}
                meta={`${m.membershipType}${m.region ? ` (${m.region})` : ""}`}
              />
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
