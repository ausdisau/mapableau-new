import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { getControl } from "@/lib/assurance/controls/control-service";

export default async function AssuranceControlDetailPage({
  params,
}: {
  params: Promise<{ controlId: string }>;
}) {
  await requireAdmin();
  const { controlId } = await params;
  const control = await getControl(controlId);
  if (!control) notFound();

  return (
    <div className="space-y-6">
      <p>
        <Link
          className="underline"
          href={`/admin/assurance/frameworks/${control.frameworkId}`}
        >
          Back to {control.framework.name}
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">
        {control.controlCode} — {control.title}
      </h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Control status is internal readiness tracking — not certification or NDIA
        approval.
      </p>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="font-medium">Objective</dt>
          <dd>{control.objective ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Status</dt>
          <dd>{control.assuranceStatus}</dd>
        </div>
        <div>
          <dt className="font-medium">Evidence freshness window</dt>
          <dd>{control.evidenceFreshnessDays} days</dd>
        </div>
      </dl>

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="font-heading text-lg font-semibold">
          Evidence ({control.assuranceEvidence.length})
        </h2>
        {control.assuranceEvidence.length === 0 ? (
          <p className="text-sm">No evidence attached.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {control.assuranceEvidence.map((evidence) => (
              <li key={evidence.id} className="border-b py-2">
                {evidence.title} · {evidence.evidenceType} ·{" "}
                {evidence.isCurrent ? "current" : "superseded"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tests-heading">
        <h2 id="tests-heading" className="font-heading text-lg font-semibold">
          Tests ({control.tests.length})
        </h2>
        {control.tests.length === 0 ? (
          <p className="text-sm">No tests defined.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {control.tests.map((test) => (
              <li key={test.id} className="border-b py-2">
                {test.name} ({test.kind}) — latest:{" "}
                {test.runs[0]?.result ?? "not_run"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="findings-heading">
        <h2 id="findings-heading" className="font-heading text-lg font-semibold">
          Open findings ({control.findings.length})
        </h2>
        {control.findings.length === 0 ? (
          <p className="text-sm">No open findings.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {control.findings.map((finding) => (
              <li key={finding.id} className="border-b py-2">
                {finding.title} · {finding.severity} · {finding.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
