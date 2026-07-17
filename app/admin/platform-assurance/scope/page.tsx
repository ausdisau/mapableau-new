import Link from "next/link";
import { redirect } from "next/navigation";

import { PlatformAssuranceShell } from "@/components/admin/platform-assurance/PlatformAssuranceShell";
import { ScopeAssessmentForm } from "@/components/admin/platform-assurance/ScopeAssessmentForm";
import { requireAdmin } from "@/lib/auth/guards";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import {
  formatScopeResultLabel,
  listRegulatorySources,
  listScopeAssessments,
  SCOPE_QUESTIONS,
} from "@/lib/platform-assurance";

export const dynamic = "force-dynamic";

export default async function PlatformAssuranceScopePage() {
  await requireAdmin();
  if (!isPlatformAssuranceEnabled()) {
    redirect("/admin?assurance=disabled");
  }

  const [sources, assessments] = await Promise.all([
    listRegulatorySources(),
    listScopeAssessments(),
  ]);

  const ndisSource =
    sources.find((s) => s.sourceKey === "ndis_platform_providers") ??
    sources[0];

  return (
    <PlatformAssuranceShell
      title="Platform scope assessments"
      description="Structured applicability questionnaire. Results are review opinions. Assurance officers cannot finalise likely in/out-of-scope without legal review."
      pathname="/admin/platform-assurance/scope"
    >
      {ndisSource ? (
        <ScopeAssessmentForm
          sourceVersionId={ndisSource.id}
          sourceTitle={ndisSource.title}
          questions={SCOPE_QUESTIONS}
        />
      ) : (
        <p className="text-muted-foreground">No regulatory sources seeded.</p>
      )}

      <section aria-labelledby="assessments-heading" className="space-y-3">
        <h2 id="assessments-heading" className="text-lg font-semibold">
          Existing assessments
        </h2>
        {assessments.length === 0 ? (
          <p className="text-muted-foreground">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {assessments.map((a) => (
              <li key={a.id} className="rounded-lg border p-3">
                <p className="font-medium">{a.functionName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatScopeResultLabel(a.result)} · {a.status}
                </p>
                <p className="mt-2">
                  <Link
                    href={`/admin/platform-assurance/scope/${a.id}/export`}
                    className="text-sm underline underline-offset-2"
                  >
                    Open readiness export
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformAssuranceShell>
  );
}
