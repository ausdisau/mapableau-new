import Link from "next/link";

import { listAssessorCasesForUser } from "@/lib/assessor-tools/assessor-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AssessorPortalPage() {
  const user = await requirePermission("assessor:portal");
  const cases = await listAssessorCasesForUser(user.id, user.primaryRole);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Assessor tools</h1>
      <p className="text-muted-foreground">
        Case workflow for accessibility and quality assessments — not legal
        certification.
      </p>
      <Link href="/dashboard" className="text-sm text-primary underline">
        Back to dashboard
      </Link>
      <ul className="space-y-2">
        {cases.map((c) => (
          <li key={c.id} className="rounded-lg border p-3">
            <strong>{c.caseType}</strong>
            <span className="ml-2 text-sm">({c.status})</span>
            {c.referenceCode ? (
              <p className="text-xs text-muted-foreground">Ref: {c.referenceCode}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
