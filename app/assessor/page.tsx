import Link from "next/link";

import {
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { listAssessorCasesForUser } from "@/lib/assessor-tools/assessor-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AssessorPortalPage() {
  const user = await requirePermission("assessor:portal");
  const cases = await listAssessorCasesForUser(user.id, user.primaryRole);

  return (
    <CorePageContainer variant="narrow">
      <CorePageHeader
        eyebrow="Provider"
        title="Assessor tools"
        description="Case workflow for accessibility and quality assessments — not legal certification."
      >
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Back to control panel
        </Link>
      </CorePageHeader>
      {cases.length === 0 ? (
        <CoreEmptyState
          title="No cases assigned"
          description="Assessment cases linked to your account will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {cases.map((c) => (
            <li key={c.id}>
              <CoreRecordCard
                title={c.caseType}
                meta={c.status}
              >
                {c.referenceCode ? (
                  <p className="text-xs text-muted-foreground">Ref: {c.referenceCode}</p>
                ) : null}
              </CoreRecordCard>
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
