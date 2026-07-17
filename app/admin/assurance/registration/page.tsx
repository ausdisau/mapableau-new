import Link from "next/link";

import { listRegistrationApplications } from "@/lib/assurance/registration/provider-registration-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AssuranceRegistrationPage() {
  await requireAdmin();
  const applications = await listRegistrationApplications();

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">NDIS registration applications</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Registration status is not platform approval and does not activate production NDIA
        submission.
      </p>
      <ul className="space-y-3">
        {applications.map((app) => (
          <li key={app.id} className="border-b py-2">
            <div className="font-medium">
              {app.pathway} · {app.status}
            </div>
            <div className="text-sm">
              Org {app.organisationId} · 0137: {app.includes0137 ? "yes" : "no"} ·
              readiness {app.readinessDecision}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
