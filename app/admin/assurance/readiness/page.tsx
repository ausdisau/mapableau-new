import Link from "next/link";

import { evaluateAssuranceReadiness } from "@/lib/assurance/readiness/evaluate-assurance-readiness";
import { projectAssuranceReadiness } from "@/lib/assurance/readiness/readiness-projection";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AssuranceReadinessPage() {
  await requireAdmin();
  const result = await evaluateAssuranceReadiness();
  const projection = projectAssuranceReadiness(result);

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Assurance readiness</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        {projection.plainLanguage}
      </p>
      <p>
        Decision: <strong>{projection.decision}</strong>
      </p>
      <ul className="list-disc pl-6 text-sm">
        {projection.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Flags are not readiness. Can support approval:{" "}
        {projection.canSupportApproval ? "conditionally yes" : "no"}
      </p>
    </div>
  );
}
