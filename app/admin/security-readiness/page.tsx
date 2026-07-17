import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { listAssuranceFrameworks } from "@/lib/assurance/frameworks/framework-service";
import { evaluateAssuranceReadiness } from "@/lib/assurance/readiness/evaluate-assurance-readiness";
import { projectAssuranceReadiness } from "@/lib/assurance/readiness/readiness-projection";

export default async function SecurityReadinessPage() {
  await requireAdmin();
  const frameworks = await listAssuranceFrameworks();
  const readiness = projectAssuranceReadiness(await evaluateAssuranceReadiness());

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Security readiness</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Feature flags are not readiness. MapAble is not certified because controls are tracked.
        See{" "}
        <Link className="underline" href="/admin/assurance">
          Assurance
        </Link>{" "}
        for Wave 6 gates.
      </p>
      <p className="text-sm">
        Current assurance decision: <strong>{readiness.decision}</strong> —{" "}
        {readiness.plainLanguage}
      </p>
      {frameworks.map((f) => (
        <section key={f.id} className="rounded-lg border p-4">
          <h2 className="font-semibold">{f.name}</h2>
          <p className="text-sm">
            {f.kind} · {f.controls.length} controls tracked
          </p>
        </section>
      ))}
    </div>
  );
}
