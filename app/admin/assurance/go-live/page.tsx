import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { listGoLiveAssessments } from "@/lib/assurance/go-live/go-live-service";

export default async function GoLivePage() {
  await requireAdmin();
  const assessments = await listGoLiveAssessments();

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Production go-live assessments</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Go-live is never passed by feature flags alone. Controlled pilots are not
        auto-activated in Wave 6.
      </p>
      <ul className="space-y-3">
        {assessments.map((a) => (
          <li key={a.id} className="border-b py-2">
            <div className="font-medium">
              {a.decision} · readiness {a.readinessDecision}
            </div>
            <div className="text-sm">
              flags={String(a.featureFlagsSatisfied)} assurance={String(a.assuranceSatisfied)}{" "}
              registration={String(a.registrationSatisfied)} pilots={a.pilots.length}
            </div>
            {a.decisionNotes ? <p className="text-sm">{a.decisionNotes}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
